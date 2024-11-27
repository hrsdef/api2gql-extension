import * as vscode from 'vscode';
import { Api1GqlGenerator } from './generator';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('api1-gql.generate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        try {
            const document = editor.document;
            const text = document.getText();

            const generator = new Api1GqlGenerator();
            const result = generator.generate(text);

            // 创建新的输出文件
            const workspaceEdit = new vscode.WorkspaceEdit();
            
            // GraphQL 查询
            const gqlUri = vscode.Uri.file(document.uri.fsPath + '.graphql');
            workspaceEdit.createFile(gqlUri, { overwrite: true });
            workspaceEdit.insert(gqlUri, new vscode.Position(0, 0), result.gql);

            // TypeScript 类型定义
            const typedefsUri = vscode.Uri.file(document.uri.fsPath + '.types.ts');
            workspaceEdit.createFile(typedefsUri, { overwrite: true });
            workspaceEdit.insert(typedefsUri, new vscode.Position(0, 0), result.typeDefs);

            // Resolver
            const resolverUri = vscode.Uri.file(document.uri.fsPath + '.resolver.ts');
            workspaceEdit.createFile(resolverUri, { overwrite: true });
            workspaceEdit.insert(resolverUri, new vscode.Position(0, 0), result.resolver);

            await vscode.workspace.applyEdit(workspaceEdit);
            vscode.window.showInformationMessage('GraphQL code generated successfully!');

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate GraphQL: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}