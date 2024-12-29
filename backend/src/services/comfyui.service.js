const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class RunningHubService {
    constructor() {
        this.baseUrl = `https://${process.env.RUNNINGHUB_URL}`;
    }

    // 获取通用请求头
    getCommonHeaders() {
        return {
            'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Host': process.env.RUNNINGHUB_URL,
            'Connection': 'keep-alive'
        };
    }

    // 上传图片到RunningHub
    async uploadImage(imageData) {
        try {
            // 确保uploads目录存在
            if (!fs.existsSync('./uploads')) {
                fs.mkdirSync('./uploads');
            }

            // 将base64图片数据写入临时文件
            const tempFilePath = './uploads/temp.jpg';
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(tempFilePath, imageBuffer);

            // 创建FormData对象
            const formData = new FormData();
            formData.append('apiKey', process.env.RUNNINGHUB_API_KEY);
            formData.append('file', fs.createReadStream(tempFilePath));
            formData.append('fileType', 'image');

            const response = await axios.post(`${this.baseUrl}/task/openapi/upload`, formData, {
                headers: {
                    ...this.getCommonHeaders(),
                    'Content-Type': 'multipart/form-data',
                    ...formData.getHeaders()
                }
            });

            // 删除临时文件
            fs.unlinkSync(tempFilePath);

            // 检查响应状态
            console.log('上传响应:', JSON.stringify(response.data, null, 2));

            if (response.data.code !== 0) {
                throw new Error(`图片上传失败: ${response.data.msg}`);
            }

            return response.data.data;
        } catch (error) {
            if (error.response?.data) {
                console.error('上传错误响应:', JSON.stringify(error.response.data, null, 2));
                throw new Error(`Image upload failed: ${error.response.data.msg || '未知错误'}`);
            }
            throw new Error(`Image upload failed: ${error.message}`);
        }
    }

    // 执行工作流
    async runWorkflow(fileName) {
        try {
            const workflowData = {
                workflowId: process.env.RUNNINGHUB_WORKFLOW_ID,
                apiKey: process.env.RUNNINGHUB_API_KEY,
                nodeInfoList: [{
                    nodeId: "40", // LoadImage节点的ID
                    fieldName: "image",
                    fieldValue: fileName
                }]
            };

            const response = await axios.post(`${this.baseUrl}/task/openapi/create`, workflowData, {
                headers: this.getCommonHeaders()
            });

            // 检查响应状态
            console.log('工作流响应:', JSON.stringify(response.data, null, 2));

            if (response.data.msg === 'TASK_QUEUE_MAXED') {
                throw new Error('服务器任务队列已满，请稍后重试');
            }

            if (!response.data.data?.taskId) {
                throw new Error(`无效的工作流响应: ${JSON.stringify(response.data)}`);
            }

            return {
                status: 'success',
                taskId: response.data.data.taskId,
                clientId: response.data.data.clientId,
                taskStatus: response.data.data.taskStatus
            };
        } catch (error) {
            if (error.response?.data) {
                console.error('工作流错误响应:', JSON.stringify(error.response.data, null, 2));
                throw new Error(`Workflow execution failed: ${error.response.data.msg || '未知错误'}`);
            }
            throw new Error(`Workflow execution failed: ${error.message}`);
        }
    }

    // 处理图片生成请求
    async processImage(imageData) {
        try {
            // 1. 上传图片
            const uploadResult = await this.uploadImage(imageData);
            
            // 2. 运行工作流
            return await this.runWorkflow(uploadResult.fileName);
        } catch (error) {
            throw error;
        }
    }

    // 获取任务状态
    async getTaskStatus(taskId) {
        try {
            const response = await axios.post(`${this.baseUrl}/task/openapi/outputs`, {
                taskId: taskId,
                apiKey: process.env.RUNNINGHUB_API_KEY
            }, {
                headers: this.getCommonHeaders()
            });

            // 检查响应状态
            console.log('任务状态响应:', JSON.stringify(response.data, null, 2));

            if (response.data.code !== 0) {
                throw new Error(response.data.msg || '获取任务状态失败');
            }

            // 如果没有输出数据，说明任务还在运行
            if (!response.data.data || response.data.data.length === 0) {
                return {
                    status: 'running'
                };
            }

            // 返回第一个输出文件的信息
            return {
                status: 'success',
                fileUrl: response.data.data[0].fileUrl,
                fileType: response.data.data[0].fileType
            };
        } catch (error) {
            const errorMsg = error.response?.data?.msg || error.message;
            
            if (errorMsg === 'APIKEY_TASK_IS_RUNNING') {
                return {
                    status: 'running'
                };
            }
            
            throw new Error(errorMsg);
        }
    }

    // 检查账号状态
    async checkAccountStatus() {
        try {
            const response = await axios.post(`${this.baseUrl}/uc/openapi/accountStatus`, {
                apikey: process.env.RUNNINGHUB_API_KEY
            }, {
                headers: this.getCommonHeaders()
            });

            // 检查响应状态
            console.log('账号状态响应:', JSON.stringify(response.data, null, 2));

            if (response.data.code !== 0) {
                throw new Error(response.data.msg || '获取账号状态失败');
            }

            return {
                status: 'success',
                remainCoins: response.data.data.remainCoins,
                currentTaskCounts: response.data.data.currentTaskCounts
            };
        } catch (error) {
            if (error.response?.data) {
                console.error('账号状态错误响应:', JSON.stringify(error.response.data, null, 2));
                throw new Error(`Failed to check account status: ${error.response.data.msg || '未知错误'}`);
            }
            throw new Error(`Failed to check account status: ${error.message}`);
        }
    }
}

module.exports = new RunningHubService(); 