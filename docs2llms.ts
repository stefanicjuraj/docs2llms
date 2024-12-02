#!/usr/bin/env

import { join, relative, basename } from "https://deno.land/std/path/mod.ts";

function validateGitHubURL(url: string): boolean {
    const GitHubURLPattern =
        /^(https:\/\/github\.com\/|[^/]+\/[^/]+$)/;
    return GitHubURLPattern.test(url);
}

interface GitHubURL {
    owner: string;
    repo: string;
    branch: string;
    path: string;
}

function parseGitHubURL(url: string): GitHubURL {
    let owner, repo, branch = "main", path = "";
    if (url.startsWith("https://github.com/")) {
        const urlParts = url.split("/");
        owner = urlParts[3];
        repo = urlParts[4];
        branch = urlParts[6] || "main";
        path = urlParts.slice(7).join("/") || "";
    } else {
        const urlParts = url.split("/");
        owner = urlParts[0];
        repo = urlParts[1];
    }
    return { owner, repo, branch, path };
}

function skipDirectory(dirName: string, skipFolders: string[]): boolean {
    return (
        skipFolders.includes(dirName) ||
        dirName.startsWith(".") ||
        ["node_modules", ".git", "dist", "build"].includes(dirName)
    );
}

async function cloneRepository(url: string, branch: string): Promise<string> {
    const temporaryDirectory = await Deno.makeTempDir();
    const cloneCommand = new Deno.Command("git", {
        args: [
            "clone",
            "-b",
            branch,
            "--single-branch",
            url,
            temporaryDirectory,
        ],
        stdout: "piped",
        stderr: "piped",
    });

    const { success, stderr } = await cloneCommand.output();

    if (!success) {
        const errorMessage = new TextDecoder().decode(stderr);
        throw new Error(`Git clone failed: ${errorMessage}`);
    }

    return temporaryDirectory;
}

async function getDirectory(
    dirPath: string,
    basePath: string,
    skipFolders: string[] = []
): Promise<{ files: string[]; fullPaths: string[] }> {
    const files: string[] = [];
    const fullPaths: string[] = [];

    async function processDirectory(currentPath: string) {
        for await (const entry of Deno.readDir(currentPath)) {
            if (entry.isDirectory && skipDirectory(entry.name, skipFolders)) {
                continue;
            }

            const fullEntryPath = join(currentPath, entry.name);

            if (
                entry.isFile &&
                [".md", ".mdx", ".txt", ".rst"].some((ext) =>
                    entry.name.endsWith(ext)
                )
            ) {
                const relativePath = relative(basePath, fullEntryPath);
                files.push(relativePath);
                fullPaths.push(fullEntryPath);
            } else if (entry.isDirectory) {
                await processDirectory(fullEntryPath);
            }
        }
    }

    await processDirectory(dirPath);

    return { files, fullPaths };
}

async function writeFiles(
    llmsFile: string,
    llmsFullFile: string,
    files: string[],
    fullPaths: string[]
) {
    const llmsWriter = await Deno.open(llmsFile, {
        create: true,
        truncate: true,
        write: true,
    });
    const llmsFullWriter = await Deno.open(llmsFullFile, {
        create: true,
        truncate: true,
        write: true,
    });

    try {
        await llmsWriter.write(new TextEncoder().encode(`# docs\n\n`));

        for (const file of files) {
            await llmsWriter.write(
                new TextEncoder().encode(`- [${basename(file)}](${file})\n`)
            );
        }

        for (const fullPath of fullPaths) {
            const fileContent = await Deno.readTextFile(fullPath);
            await llmsFullWriter.write(
                new TextEncoder().encode(fileContent + "\n\n")
            );
        }
    } finally {
        llmsWriter.close();
        llmsFullWriter.close();
    }
}

async function main() {
    const args = Deno.args;

    let localDocsDir = "";
    let llmsBaseName = "llms";
    let llmsFullBaseName = "llms-full";
    let format = "txt";
    const skipFolders: string[] = [];
    let githubUrl = "";
    let preview = false;
    let interactive = false;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case "--local":
                localDocsDir = args[++i];
                break;
            case "--llms":
                llmsBaseName = args[++i];
                break;
            case "--llms-full":
                llmsFullBaseName = args[++i];
                break;
            case "--format":
                format = args[++i].replace(/^\./, "");
                break;
            case "--skip":
                i++;
                while (i < args.length && !args[i].startsWith("--")) {
                    skipFolders.push(args[i++]);
                }
                i--;
                break;
            case "--preview":
                preview = true;
                break;
            case "--interactive":
                interactive = true;
                break;
            default:
                if (validateGitHubURL(args[i])) {
                    githubUrl = args[i].startsWith("https://github.com/") ? args[i] : `https://github.com/${args[i]}`;
                }
        }
    }

    const llmsFile = `${llmsBaseName}.${format}`;
    const llmsFullFile = `${llmsFullBaseName}.${format}`;

    if (!localDocsDir && !githubUrl) {
        console.log(`
Usage (local): docs2llms --local /path/to/directory
Usage (remote): docs2llms https://github.com/username/repository

--llms: Output file for extracted content hyperlinks. Defaults to llms.txt.
--llms-full: Output file for processed content. Defaults to llms-full.txt.
--skip: Folders to skip during processing.
--format: Format for the processed content. Available: txt, md, rst. Defaults to txt.
--preview: Preview the content in the terminal. Does not process content.
--interactive: Interactively select individual files to be processed.
            `);
        Deno.exit(1);
    }

    try {
        let dirPath: string;
        if (localDocsDir) {
            dirPath = localDocsDir;
        } else if (githubUrl) {
            const { owner, repo, branch, path } = parseGitHubURL(githubUrl);
            dirPath = await cloneRepository(
                `https://github.com/${owner}/${repo}.git`,
                branch
            );

            if (path) {
                dirPath = join(dirPath, path);
            }
        } else {
            console.log(
                '⚠️ Invalid input. Provide a valid GitHub URL or use "--local".'
            );
            Deno.exit(1);
        }

        const { files, fullPaths } = await getDirectory(
            dirPath,
            dirPath,
            skipFolders
        );

        if (preview) {
            console.log("🕵️ Preview of directories and files to be processed.");
            console.log("🗂️ Files:", files);
        } else if (interactive) {
            const confirmFiles: string[] = [];
            const confirmFullPaths: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fullPath = fullPaths[i];
                const userInput = prompt(`(${i + 1}/${files.length}): ${file}? (y/n)`);
                if (userInput?.toLowerCase() === 'y') {
                    confirmFiles.push(file);
                    confirmFullPaths.push(fullPath);
                }
            }

            await writeFiles(llmsFile, llmsFullFile, confirmFiles, confirmFullPaths);

            console.log(`\n✅ ${llmsFile}`);
            console.log(`\n✅ ${llmsFullFile}`);
        } else {
            await writeFiles(llmsFile, llmsFullFile, files, fullPaths);

            console.log(`\n✅ ${llmsFile}`);
            console.log(`\n✅ ${llmsFullFile}`);
        }

        if (githubUrl && !preview && !interactive) {
            await Deno.remove(dirPath, { recursive: true });
        }
    } catch (error) {
        console.error("Error:", error);
        Deno.exit(1);
    }
}

if (import.meta.main) {
    main();
}
