use clap::Parser;
use reqwest::blocking::Client;
use serde_json::json;
use std::fs;
use std::path::PathBuf;

/// 简单的创作助手：结合原始材料与提示词，调用 Ollama 模型生成作品
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// 原始材料文件路径（txt）
    #[arg(short, long, value_name = "FILE")]
    material: PathBuf,

    /// 提示词配置文件路径（文本文件，可包含 {{material}} 占位符）
    #[arg(short, long, value_name = "FILE")]
    prompt: PathBuf,

    /// 输出文件路径（默认 output.txt）
    #[arg(short, long, default_value = "output.txt")]
    output: PathBuf,

    /// Ollama 服务地址（默认 http://localhost:11434）
    #[arg(long, default_value = "http://localhost:11434")]
    ollama_url: String,

    /// 模型名称（默认 deepseek-r1:7b）
    #[arg(long, default_value = "deepseek-r1:7b")]
    model: String,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    // 1. 读取原始材料
    let material = fs::read_to_string(&args.material)
        .map_err(|e| anyhow::anyhow!("无法读取材料文件 {}: {}", args.material.display(), e))?;

    // 2. 读取提示词配置文件
    let mut prompt_template = fs::read_to_string(&args.prompt)
        .map_err(|e| anyhow::anyhow!("无法读取提示词文件 {}: {}", args.prompt.display(), e))?;

    // 3. 组合最终提示词
    let final_prompt = if prompt_template.contains("{{material}}") {
        prompt_template.replace("{{material}}", &material)
    } else {
        // 无占位符则将材料附加在末尾
        prompt_template.push_str("\n\n");
        prompt_template.push_str(&material);
        prompt_template
    };

    // 4. 调用 Ollama API
    let client = Client::new();
    let api_url = format!("{}/api/generate", args.ollama_url);
    let request_body = json!({
        "model": args.model,
        "prompt": final_prompt,
        "stream": false,
    });

    let response = client
        .post(&api_url)
        .json(&request_body)
        .send()
        .map_err(|e| anyhow::anyhow!("Ollama 请求失败: {}", e))?;

    // 修复：先提取状态码，再消费 response 读取错误文本
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().unwrap_or_default();
        return Err(anyhow::anyhow!("Ollama 返回错误 ({}): {}", status, error_text));
    }

    // 成功分支：解析 JSON 响应
    let json_response: serde_json::Value = response
        .json()
        .map_err(|e| anyhow::anyhow!("解析响应 JSON 失败: {}", e))?;

    let generated = json_response["response"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("响应中缺少 'response' 字段"))?;

    // 5. 写入输出文件
    fs::write(&args.output, generated)
        .map_err(|e| anyhow::anyhow!("无法写入输出文件 {}: {}", args.output.display(), e))?;

    println!("✅ 创作完成！结果已保存至: {}", args.output.display());
    Ok(())
}