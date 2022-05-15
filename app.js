const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();

/** 功能配置 */
const config = {
  inPath: path.join(cwd, './script.js'),
  outPath: path.join(cwd, './script.min.js'),
};

/** 功能数据 */
const data = {
  debounce: null,
  watcher: null,
};

/** Babel 配置选项 */
const babelOptions = {

  /** https://www.npmjs.com/package/babel-preset-minify */
  minify: {
    mangle: {
      keepClassName: false,
      keepFnName: false,
    },
    removeConsole: false,
    removeDebugger: false,
  },

  /**
   * @desc 参考：https://babeljs.io/docs/en/babel-preset-env
   * @type { import('@babel/preset-env').Options }
   */
  presetEnv: {
    targets: { chrome: '50' }
  },

};

/** 文件转换处理 */
const handler = function () {

  console.log('[文件转换] 开始:', new Date().getTime());
  console.time('[文件转换] 用时');

  const inContent = fs.readFileSync(config.inPath);
  const result = babel.transformSync(inContent, {
    comments: false,
    presets: [
      ['@babel/preset-env', babelOptions.presetEnv],
      ['minify', babelOptions.minify],
    ],
    sourceMaps: false,
    sourceType: 'script',
  });
  const outContent = (result.code ?? '').replace(/\n/g, '\\n');

  // 输出文件
  fs.writeFileSync(config.outPath, outContent, { flag: 'w' });

  console.timeEnd('[文件转换] 用时');
  console.log('[文件转换] 结束:', new Date().getTime());

};

// 清空显示内容
console.clear();

// 设置窗口标题
process.title = 'auto-minify-js';

// 若输入文件不存在，先创建
if (!fs.existsSync(config.inPath)) {
  fs.writeFileSync(config.inPath, '', { flag: 'w' });
}

// 监听输入文件变化
data.watcher = fs.watch(config.inPath, {
  persistent: true,
  recursive: false,
}, function (type, fileName) {

  if (type !== 'change') {
    return;
  }

  console.log('[文件监听]', type, fileName);
  clearTimeout(data.debounce);
  data.debounce = setTimeout(() => {
    handler();
  }, 1000);

});

// 监听退出
process.on('SIGINT', function () {
  console.log('[信号监听] SIGINT');
  data.watcher && data.watcher.close();
  console.log('[文件监听] 已停止');
  process.exit();
});

handler();
