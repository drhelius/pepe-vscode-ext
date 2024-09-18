// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Register chat participant handler
	vscode.chat.createChatParticipant('chat.pepe', async (request, context, response, token) => {
		
		// get user query
		const userQuery = request.prompt;

		// get gpt-4o chat model
		const chatModels = await vscode.lm.selectChatModels({family: 'gpt-4o'});
		
		// call kernel-memory API and get response
		const apiResponse = await callKernelMemory(userQuery);

		// construct a chat message with user query and additional context
		const chatMessages = [
			vscode.LanguageModelChatMessage.User("User query: " + userQuery + "\n\nAdditional Context: " + apiResponse.text)
		];
		
		// send request to chat model and get response
		const chatResponse = await chatModels[0].sendRequest(chatMessages, undefined, token);

		// stream response to chat
		for await (const chunk of chatResponse.text) {
			response.markdown(chunk);
		}
	});

}

// This method is called when your extension is deactivated
export function deactivate() {}

// This method is used to call the kernel-memory API
async function callKernelMemory(message: string): Promise<any> {
	const url = 'http://127.0.0.1:9001/ask';
	const headers = {
		'Content-Type': 'application/json'
	};
	const body = JSON.stringify({
		question: message,
		filters: [{}],
		index: "",
		args: {
			custom_rag_max_tokens_int: 1000
		}
	});

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: headers,
			body: body
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error:', error);
		return error;
	}
}
