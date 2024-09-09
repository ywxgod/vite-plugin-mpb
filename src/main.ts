
import { getInput, move, getReWriteList } from "./mp";
import historyApiCallback from 'connect-history-api-fallback';
import type { Options } from 'connect-history-api-fallback'
import { MpOptions } from "./types";


/**
 *
 * vite多页打包专有插件
 * @author ywx1818@163.com
 *
 * 默认你的所有页面代码都在项目更目录下的src/pages文件夹下，
 * 如果不在src/pages下面，可以配置scanDir属性，比如：src/mypages，正常的页面路径如下：
 * 例如主页：projectRoot/src/pages/main/index.html，
 * 主页逻辑入口：projectRoot/src/pages/main/index.ts
 * 注意：页面的html文件与逻辑入口ts/js文件的文件名必须是相同，默认是index。
 * 如果入口文件名不是index，需要配置scanFile属性，如：xx.{html,ts}
 *
 * 如果想指定某个页面为首页，可以设置mainPage属性。默认mainPage属性为main，即src/page/main/index.html为首页。
 * 当指定mainPage为其他页面时，其他页面的原访问路径将失效。
 * 比如有个页面：src/pages/page1/page2/index.html，入口逻辑：src/pages/page1/page2/index.ts
 * 要指定上面的页面为主页，则mainPage为：page1/page2，这样访问首页：http://localhost:5173访问到的就是上面的页面。
 * 而页面：http://localhost:5173/page1/page2/index.html则不再存在。
 *
 * <b>
 * 注意：指定mainPage时，一定是要最后存在于你所打包的页面之中。
 * 配置的页面经过includes，ignores一番处理，保留下来的页面可能就没有包含mainPage了。
 * </b>
 *
 * 用法1：只想指定某些页面进行打包
 * ```
 * mp({
 *     includes: ['page1', 'page2']
 * })
 * ```
 * 用法2：全部打包
 * ```
 * mp()
 * ```
 * 用法3：全部打包的基础上，想忽略一些页面
 * ```
 * mp({
 *     ignores: ['page1', 'page2']
 * })
 * ```
 * 用法4：指定模块打包的基础上，想忽略一些页面
 * ```
 * mp({
 *     includes: ['page1', 'page2', 'page3']
 *     ignores: ['page1', 'page2']
 * })
 * ```
 * 此时只会构建page3
 *
 * */
mp.verInfo = {
    version: '__VERSION__',
    buildDate: '__BUILD_DATE__',
    author: '__AUTHOR__'
};

export default function mp(mpOpt: MpOptions) {
    const defaultMpOpt = {
        scanDir: 'src/pages',
        scanFile: 'index.{html,ts,js}',
        mainPage: 'main'
    };
    const options = Object.assign({}, defaultMpOpt, mpOpt);
    if (!options.scanFile.includes('.')) {
        console.error(`scanFile: 非法`);
        process.exit(1);
    }
    let userConfig: Record<string, any>;
    const plugin = {
        name: 'vite-plugin-mp',
        enforce: 'pre',
        async config(config: Record<string, any>) {
            userConfig = config;
            const input = await getInput(options);
            config.build = config.build || {};
            config.build.rollupOptions = config.build.rollupOptions || {};
            config.build.rollupOptions.input = input;
        },
        async configureServer(server: {middlewares: {use: Function}}) {
            const app = server.middlewares;
            const historyOpt: Options = {
                verbose: Boolean(process.env.DEBUG) && process.env.DEBUG !== 'false',
                disableDotRule: undefined,
                htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
                rewrites: await getReWriteList(options),
            };
            app.use(historyApiCallback(historyOpt));
        },
        async closeBundle() {
            const root = userConfig.root || process.cwd();
            const dest = (userConfig.build && userConfig.build.outDir) || 'dist';
            await move(root, dest, options);
        }
    };

    return plugin;
}