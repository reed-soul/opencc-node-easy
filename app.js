const fs = require("fs");
const path = require("path");
const jieba = require("nodejieba");
const OpenCC = require("opencc");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// 简体中文转繁体中文的 OpenCC 实例
const converter = new OpenCC();

// 遍历目录下的所有文件
function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 递归遍历子目录
      traverseDirectory(filePath);
    } else if (stat.isFile()) {
      // 判断文件类型
      const extname = path.extname(filePath).toLowerCase();
      if ([".js", ".ts"].includes(extname)) {
        // 处理JS文件中的简体中文
        convertFile(filePath);
      }
    }
  });
}

// 将文件中的简体中文转换为繁体中文
function convertFile(filePath) {
  // 读取文件内容
  let content = fs.readFileSync(filePath, "utf-8");

  // 将文件内容解析成AST
  const ast = parser.parse(content, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  // 遍历AST，并对字符串进行简体中文到繁体中文的转换
  traverse(ast, {
    enter(path) {
      if (path.isStringLiteral()) {
        const value = path.node.value;
        const newValue = jieba
          .cut(value)
          .map((word) => {
            return converter.convertSync(word);
          })
          .join("");
        path.node.value = newValue;
      }
    },
  });

  // 将转换后的AST重新生成代码
  const output = require("@babel/core").transformFromAstSync(ast, content);

  // 将转换后的内容写回文件
  fs.writeFileSync(filePath, output.code);
}

// 测试代码
const dirPath = "./demo";

traverseDirectory(dirPath);
