use std::env;
use std::fs;
use reqwest;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 检查命令行参数
    let args: Vec<String> = env::args().collect();
    if args.len() != 2 {
        eprintln!("用法: {} <文件路径>", args[0]);
        std::process::exit(1);
    }

    let file_path = &args[1];

    // 读取文件内容
    let content = match fs::read_to_string(file_path) {
        Ok(text) => text,
        Err(e) => {
            eprintln!("读取文件失败: {}", e);
            std::process::exit(1);
        }
    };

    // 构造提示词，明确要求只返回修正后的文本
    let prompt = format!(
        "请校对以下中文文本，修正其中的语法、拼写和标点错误。\
         只返回修正后的文本，不要添加任何解释、评论或额外内容。\n\n\
         原文：\n{}",
        content
    );

    // 准备 Ollama API 请求
    let client = reqwest::Client::new();
    let url = "http://localhost:11434/api/generate";
    let payload = json!({
        "model": "deepseek-r1:7b",
        "prompt": prompt,
        "stream": false,
        "options": {
            "temperature": 0.1  // 较低温度减少随机性
        }
    });

    // 发送请求并等待响应
    let response = match client.post(url).json(&payload).send().await {
        Ok(resp) => resp,
        Err(e) => {
            eprintln!("请求 Ollama 失败: {}", e);
            eprintln!("请确保 Ollama 服务已启动 (默认 http://localhost:11434)");
            std::process::exit(1);
        }
    };

    let response_json: serde_json::Value = match response.json().await {
        Ok(json) => json,
        Err(e) => {
            eprintln!("解析响应失败: {}", e);
            std::process::exit(1);
        }
    };

    // 提取修正后的文本
    if let Some(revised) = response_json["response"].as_str() {
        println!("{}", revised);
    } else {
        eprintln!("Ollama 返回格式异常: {}", response_json);
        std::process::exit(1);
    }

    Ok(())
}