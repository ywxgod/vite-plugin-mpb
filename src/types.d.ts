export type MpOptions = {
    /** 页面所在目录：'src/pages' */
    scanDir?: string,
    /** 指定入口文件，包含两部分：index.html, index.ts/index.js */
    scanFile?: string,
    includes?: string[],
    ignores?: string[],
    /**
     * 指定包含主页的模块，如果没指定默认为main模块，
     * 如果没有main模块，或者指定了但没有找到，将不做处理
     * */
    mainPage?: string
};

export type EntryInfo = {
    /** 入口逻辑 */
    chunk: string,
    /** 入口html */
    entry: string,
    /** 产出文件名 */
    filename: string
};