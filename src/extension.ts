import * as vscode from 'vscode';
import * as path from 'path';
import { GqlGenerator } from './utils/gqlGenerator';
import { ResolverGenerator } from './utils/resolverGenerator';
import { TypeDefsGenerator } from './utils/typeDefsGenerator';
import { ApiDoc } from './utils/types';

const getResolverImports = (apiSpec: ApiDoc) => [
    "import { Query, Ctx, Args, Resolver } from 'type-graphql';",
    `import { RequestParams, Res${apiSpec.API_NAME} } from './typeDefs';`,
    "import { requestAPI } from '../../utils/request';",
    "import { Context } from 'overlord-server';"
].join('\n');

const TYPEDEFS_IMPORTS = [
    "import { Field, ObjectType, ArgsType, InputType } from 'type-graphql';"
].join('\n');

const INDENT = '    '; 

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('api2gql.generate', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('No editor is active');
                return;
            }

            const document = editor.document;
            const jsonContent = document.getText();
            const apiSpec: ApiDoc = JSON.parse(jsonContent);

            const currentDir = path.dirname(document.uri.fsPath);
            const currentFileName = path.basename(document.uri.fsPath, '.json');

            // 初始化生成器
            const gqlGenerator = new GqlGenerator(INDENT);
            const resolverGenerator = new ResolverGenerator(INDENT);
            const typeDefsGenerator = new TypeDefsGenerator(INDENT);

            // 生成内容
            const gqlContent = gqlGenerator.generate(apiSpec);
            const resolverContent = `${getResolverImports(apiSpec)}\n\n${resolverGenerator.generate(apiSpec)}`;
            const typeDefsContent = `${TYPEDEFS_IMPORTS}\n\n${typeDefsGenerator.generate(apiSpec)}`;

            // 生成文件
            const files = [
                {
                    path: path.join(currentDir, 'resolvers.ts'),
                    content: resolverContent
                },
                {
                    path: path.join(currentDir, 'typeDefs.ts'),
                    content: typeDefsContent
                },
                {
                    path: path.join(currentDir, `${currentFileName}.gql`),
                    content: gqlContent
                }
            ];

            // 写入文件
            await Promise.all(
                files.map(file => 
                    vscode.workspace.fs.writeFile(
                        vscode.Uri.file(file.path),
                        Buffer.from(file.content, 'utf8')
                    )
                )
            );

            vscode.window.showInformationMessage('GraphQL files generated successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${(error as any).message}`);
            console.error(error);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}