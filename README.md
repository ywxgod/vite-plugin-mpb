# vite-plugin-mpb

用于`vite`的专用插件，依赖`vite`。

`vite`项目默认提供的多页面构建方案需要我们将页面放置到根目录中，而`vite-plugin-mpb`没有强制指定页面存放的位置。不过`vite-plugin-mpb`只会让`vite`构建指定目录下的入口`html`。

`vite-plugin-mpb`默认你的所有页面存在于`src/pages`下面，就是说如果项目根目录下有入口`html`文件，将不会处理。你可以通过`scanDir`来配置指定页面目录，由于原来根目录下的首页不被处理，你可以通过`mainPage`来制定`src/pages`下面的某个页面作为主页即可。

## 页面的概念：
每个页面至少包含一个`html`文件，正常情况下还有一个`ts`或者`js`文件，用于处理页面逻辑。

`vite-plugin-mpb`默认这两个文件的文件名为index。如果你的页面目录下不是`index.html`,`index.ts`或`index.js`。那么需要设置scanFile来告诉`vite-plugin-mpb`怎么找到你的入口文件。

比如你的某个页面的入口文件是：`xx.html`与`xx.ts`, `scanFile`可以配置为：`'xx.{html,ts}'`。

**注意**：不管你的`html`文件和`ts`文件名是啥，但这两个文件必须保持一样的名称，就是说：`xx.html`与`yy.ts`是不允许的。

## 安装
`npm i -D vite-plugin-mpb`

## 使用
mpb函数调用不传参，默认会构建所有页面。

```typescript
import mpb from 'vite-plugin-mpb';
import { defineConfig } from 'vite';

console.log(mpb.verInfo);
// https://vitejs.dev/config/
export default defineConfig(async ({ mode, command , isPreview}) => {
  return {
    plugins: [
      vue(),
      mpb()
    ]
  };
});

```

如上代码，

通过调用`mpb.verInfo`可以查看版本信息。`mpb`函数有一个可选参数`opt：MpOptions`

```typescript
type MpOptions = {
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
```

**scanDir**：默认为`src/pages`，即为存放页面的总目录。

**scanFile**：指定入口的`html`文件与`ts/js`文件，默认为`index.{html,ts,js}`。其他文件名还测试，建议每个页面的入口文件为默认就行。

**includes**：指定需要构建的页面目录，如果不是第一层的页面，如页面在`src/pages/page1/page2/index.html`，那么可以指定`includes`为：`['page1']`， 或者`['page1/page2']`。

**ignores**：指定不需要构建的页面

**mainPage**：指定主页。默认为`src/pages/main`下面的页面。如果没有指定就没有主页，但不影响其他页面访问和构建。如果指定了，但`src/pages`下面找不到，效果同上。

## 使用场景
假设我们的页面目录`src/pages`的结构为：

```shell
├─main
│      App.vue
│      index.html
│      index.ts
│      style.scss
│
└─page1
    │  index.html
    │  index.ts
    │  index.vue
    │  page1.scss
    │
    └─page2
            index.html
            index.ts
            index.vue

```

```typescript
// 只构建page1
mpb({ includes: ['page1'] }) // page2也会被构建
// 只构建page1，但不构建page2
mpb({ includes: ['page1'], ignores: ['page1/page2'] })
// 构建所有页面，并指定主页为page1/index.html
mpb({ mainPage: 'page1' })
// 全量构建的基础上，忽略一些页面
mpb({ ignores: ['main', 'page1'] })
```



文档如果更新，最新文档请链接：
https://www.yuque.com/jkzm/lluc6a/kv0m94p2omk303bk?singleDoc#%20%E3%80%8Avite-plugin-mpb%E3%80%8B