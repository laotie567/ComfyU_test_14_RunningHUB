require('dotenv').config();
const RunningHubService = require('./src/services/comfyui.service');

// 检查环境变量
console.log('环境变量检查:');
console.log('RUNNINGHUB_URL:', process.env.RUNNINGHUB_URL);
console.log('RUNNINGHUB_API_KEY:', process.env.RUNNINGHUB_API_KEY ? '已设置' : '未设置');
console.log('RUNNINGHUB_WORKFLOW_ID:', process.env.RUNNINGHUB_WORKFLOW_ID);
console.log('----------------------------------------\n');

// 轮询任务状态的函数
async function pollTaskStatus(taskId, maxAttempts = 60) { // 60次尝试，每次5秒，总共300秒（5分钟）
    console.log(`开始轮询任务状态，任务ID: ${taskId}`);
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const taskStatus = await RunningHubService.getTaskStatus(taskId);
            console.log(`第 ${attempts + 1} 次查询状态:`, JSON.stringify(taskStatus, null, 2));
            
            if (taskStatus.status === 'success' && taskStatus.fileUrl) {
                console.log('任务完成！生成的图片URL:', taskStatus.fileUrl);
                return taskStatus;
            } else if (taskStatus.status === 'running') {
                console.log(`第 ${attempts + 1} 次查询: 任务仍在运行中...`);
            }
        } catch (error) {
            console.error(`查询失败:`, error.message);
            throw error;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            console.log('等待5秒后重试...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    throw new Error('任务状态查询超时（5分钟）');
}

// 主测试函数
async function runTests() {
    console.log('开始测试 RunningHub 服务...\n');

    try {
        // 1. 测试账号状态
        console.log('1. 测试账号状态...');
        const accountStatus = await RunningHubService.checkAccountStatus();
        console.log('账号状态:', accountStatus);
    } catch (error) {
        console.log('账号状态检查失败:', error.message);
    }
    console.log('----------------------------------------\n');

    try {
        // 2. 测试图片上传和处理
        console.log('2. 测试图片上传和处理...');
        
        // 创建一个1x1像素的黑色JPEG图片的base64字符串
        const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        
        console.log('图片验证通过');
        const processResult = await RunningHubService.processImage(base64Image);
        console.log('处理结果:', processResult);

        // 3. 测试任务状态查询
        console.log('3. 测试任务状态查询...');
        console.log('开始轮询任务状态（最长等待60秒）...');
        await pollTaskStatus(processResult.taskId);

    } catch (error) {
        console.log('图片处理失败:', error.message);
    }
    console.log('----------------------------------------\n');

    console.log('测试完成！');
}

// 运行测试
runTests(); 