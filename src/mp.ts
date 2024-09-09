import type { Rewrite } from 'connect-history-api-fallback';
import { glob } from 'glob';
import { normalizePath } from 'vite';
import path from 'node:path';
import fsp from 'node:fs/promises';
import chalk from "chalk";
import {EntryInfo, MpOptions} from "./types";

const warning = chalk.hex('#FFA500');

async function getPages(options:MpOptions) {
    const { scanDir, scanFile, includes, ignores } = options;
    let files:string[] = [];
    const glopOpt = {
        ignore: {
            ignored: (p: Record<string, any>) => {
                if (!ignores || !ignores.length) return false;
                const relPath = normalizePath(p.relative(p.fullpath()));
                return ignores.some(i => {
                    return relPath.includes(i);
                });
            },
        },
        nodir: true
    };
    if (!includes || !includes.length) {
        files = await glob(`${scanDir}/**/${scanFile}`, glopOpt);
    } else {
        for(const j of includes) {
            files = [...await glob(`${scanDir}/${j}/**/${scanFile}`, glopOpt), ...files];
        }
    }
    const entryInfos = files.reduce((acc:Record<string, EntryInfo>, file) => {
        const normalPath = normalizePath(file);
        const filePath = normalPath.replace(scanDir+'/', '');
        const basename = path.basename(file);
        const filename = filePath.replace('/'+basename, '');
        if (!acc[filename]) {
            acc[filename] = { filename, chunk: '', entry: '' };
        }
        if (basename.endsWith('.ts') || basename.endsWith('.js')) {
            acc[filename].chunk = file;
        }
        if (basename.endsWith('.html')) {
            acc[filename].entry = file;
        }
        return acc;
    }, {});
    return Object
        .keys(entryInfos)
        .map(key => entryInfos[key]);
}

async function copyDir(target:string, dest:string, excludes:string[] = []) {
    await fsp.access(target).catch((err: Error) => console.log(err));
    await fsp.access(dest).catch(async () => {
        await fsp.mkdir(dest, { recursive: true });
    });
    const targetFiles:string[] = await fsp.readdir(target);
    for(const i of targetFiles) {
        const sourcePath = path.join(target, i);
        const destPath = path.join(dest, i);
        if (excludes.includes(i)) continue;
        const stat = await fsp.stat(sourcePath);
        if (stat && stat.isDirectory()) {
            await fsp.access(destPath).catch(async () => {
                await fsp.mkdir(destPath, { recursive: true });
            });
            await copyDir(sourcePath, destPath);
        } else {
            await fsp.copyFile(sourcePath, destPath);
        }
    }
}

async function removeDir(target:string) {
    let exist = true;
    await fsp.access(target).catch(() => { exist = false; });
    if (!exist) return Promise.resolve();
    const targetFiles = await fsp.readdir(target);
    if (!targetFiles.length) {
        await fsp.rmdir(target).catch((err: Error) => console.log(err));
    } else {
        for(const i of targetFiles) {
            const sourcePath = path.join(target, i);
            const stat = await fsp.stat(sourcePath);
            if (stat.isDirectory()) {
                await removeDir(sourcePath);
            } else {
                await fsp.unlink(sourcePath).catch((err: Error) => console.log(err));
            }
        }
        await fsp.rmdir(target).catch((err: Error) => console.log(err));
    }
}

async function copyFile(targetFile:string, dest:string) {
    if (!targetFile || !dest) throw new Error('路径无效');
    const targetBaseName = path.extname(targetFile) && path.basename(targetFile);
    if (!targetBaseName) throw new Error('路径无效');
    const destBaseName = path.extname(dest) && path.basename(dest);
    if (!destBaseName) dest = path.join(dest, targetBaseName);
    await fsp.copyFile(targetFile, dest);
}

async function hasDir(targetDir: string) {
    const files = await fsp.readdir(targetDir);
    for(const file of files) {
        const fileInfo = await fsp.stat(path.join(targetDir, file));
        if (fileInfo.isDirectory()) return true;
    }
    return false;
}

export async function move(root:string, dest:string, mpOptions: MpOptions) {
    const { scanDir, mainPage } = mpOptions;
    if (!scanDir) throw new Error('scanDir非法');
    const resolve = (p: string) => path.resolve(root, p);
    const oldPath = normalizePath(resolve(`${dest}/${scanDir}`));
    const newPath = normalizePath(resolve(`${dest}`))
    await copyDir(oldPath, newPath);
    const targetDir = normalizePath(resolve(`${dest}/${scanDir.split('/')[0]}`));
    await removeDir(targetDir);

    if (mainPage) {
        const files = await fsp.readdir(resolve(dest));
        if (files.includes(mainPage)) {
            const sourceFile = resolve(`${dest}/${mainPage}/index.html`);
            await copyFile(normalizePath(sourceFile), newPath);
            const mainDir = path.join(sourceFile, '../');
            const anyDir = await hasDir(mainDir);
            if (!anyDir) {
                await removeDir(normalizePath(mainDir));
            } else {
                await fsp.unlink(sourceFile);
            }
        } else {
            console.log(warning('warning: 找不到mainPage的主页模块'));
        }
    }
}

export async function getReWriteList(options: MpOptions) {
    let pages = await getPages(options);
    const { scanDir, mainPage } = options;
    const list: Rewrite[] = [];
    const validMainPage = mainPage && pages.some(page => {
        return page.filename === mainPage;
    });
    if (validMainPage) {
        list.push({ from: /^\/$/, to: `./${scanDir}/${mainPage}/index.html` });
    } else {
        console.log(warning('warning: 没配置主页模块或者找不到主页模块'));
    }
    if (validMainPage) {
        pages = pages.filter(page => page.filename !== mainPage);
    }
    pages.forEach(page => {
        const from = new RegExp(`^/${page.filename}/index.html`);
        const to = `./${scanDir}/${page.filename}/index.html`;
        list.push({ from, to });
    });
    return list
}

export async function getInput(options: MpOptions) {
    const pages = await getPages(options);
    return pages.reduce((acc:Record<string, string>, page) => {
        acc[page.filename] = normalizePath(page.entry);
        return acc;
    }, {});
}