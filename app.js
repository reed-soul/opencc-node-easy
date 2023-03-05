const fs = require("fs");
const path = require("path");
const jieba = require("nodejieba");
const OpenCC = require("opencc");

// 简体中文转繁体中文的 OpenCC 实例
const converter = new OpenCC("s2t.json");

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
      if ([".js", ".ts", ".vue"].includes(extname)) {
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

  // 将注释部分替换为占位符
  content = content.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n\r]*/g, (match) => {
    const len = match.length;
    const placeholder = Array(len).fill("*").join("");
    return placeholder;
  });

  // 使用 nodejieba 分词将简体中文转换为繁体中文
  content = jieba
    .cut(content)
    .map((word) => {
      return converter.convertSync(word);
    })
    .join("");

  // 将占位符替换回注释内容
  content = content.replace(/\*+/g, (match) => {
    const len = match.length;
    return Array(len).fill("*").join("");
  });

  // 将转换后的内容写回文件
  fs.writeFileSync(filePath, content);
}

// 测试代码
const dirPath = "./demo";
traverseDirectory(dirPath);
