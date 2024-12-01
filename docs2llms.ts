function validateGitHubURL(url: string): boolean {
    const GitHubURLPattern =
        /^https:\/\/github\.com\/[^/]+\/[^/]+(\/(tree\/[^/]+\/.+)?)?$/;
    return GitHubURLPattern.test(url);
}

interface GitHubURL {
    owner: string;
    repo: string;
    branch: string;
    path: string;
}

function parseGitHubURL(url: string): GitHubURL {
    const urlParts = url.split("/");
    return {
        owner: urlParts[3],
        repo: urlParts[4],
        branch: urlParts[6] || "main",
        path: urlParts.slice(7).join("/") || "",
    };
}

interface GitHubAPIResponse {
    type: "file" | "dir";
    name: string;
    path: string;
    download_url?: string;
    content?: string;
}

async function getContent(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    token?: string
): Promise<GitHubAPIResponse[]> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const headers: Record<string, string> = {};

    if (token) {
        headers["Authorization"] = `token ${token}`;
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
}

async function getRawContent(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    token?: string
): Promise<string> {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const headers: Record<string, string> = {};

    if (token) {
        headers["Authorization"] = `token ${token}`;
    }

    const response = await fetch(rawUrl, { headers });

    if (!response.ok) {
        throw new Error(`Content fetch error: ${response.statusText}`);
    }

    return await response.text();
}

function skipDirectory(dirName: string, skipFolders: string[]): boolean {
    return skipFolders.includes(dirName);
}

async function processDirectory(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    llmsFile: string,
    llmsFullFile: string,
    token?: string,
    skipFolders: string[] = []
): Promise<void> {
    const fileExtensions = [".md", ".mdx", ".txt", ".rst"];
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
        await llmsWriter.write(new TextEncoder().encode(`# ${repo}\n\n`));

        const contents = await getContent(owner, repo, branch, path, token);

        for (const item of contents) {
            const itemUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${item.path}`;
            if (
                item.type === "file" &&
                fileExtensions.some((ext) => item.name.endsWith(ext))
            ) {
                const rawContent = await getRawContent(
                    owner,
                    repo,
                    branch,
                    item.path,
                    token
                );
                await llmsWriter.write(
                    new TextEncoder().encode(`- [${item.name}](${itemUrl})\n`)
                );
                await llmsFullWriter.write(
                    new TextEncoder().encode(rawContent + "\n\n")
                );
                console.log(`Processing: ${item.path}`);
            } else if (
                item.type === "dir" &&
                !skipDirectory(item.name, skipFolders)
            ) {
                await llmsWriter.write(
                    new TextEncoder().encode(`## ${item.name}\n`)
                );
                await processDirectory(
                    owner,
                    repo,
                    branch,
                    item.path,
                    llmsFile,
                    llmsFullFile,
                    token,
                    skipFolders
                );
            } else {
                console.log(`Skipping: ${item.path}`);
            }
        }
    } finally {
        llmsWriter.close();
        llmsFullWriter.close();
    }
}

async function processLocalDirectory(
    dirPath: string,
    llmsFile: string,
    llmsFullFile: string,
    skipFolders: string[] = []
): Promise<void> {
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
        await llmsWriter.write(new TextEncoder().encode(`# ${dirPath}\n\n`));

        for await (const entry of Deno.readDir(dirPath)) {
            if (
                entry.isFile &&
                [".md", ".mdx", ".txt", ".rst"].some((ext) =>
                    entry.name.endsWith(ext)
                )
            ) {
                if (
                    !skipFolders.some((folder) => entry.name.startsWith(folder))
                ) {
                    const filePath = `${dirPath}/${entry.name}`;
                    const fileContent = await Deno.readTextFile(filePath);

                    await llmsWriter.write(
                        new TextEncoder().encode(
                            `- [${entry.name}](${filePath})\n`
                        )
                    );
                    await llmsFullWriter.write(
                        new TextEncoder().encode(fileContent + "\n\n")
                    );
                    console.log(`Processing: ${entry.name}`);
                }
            }
        }
    } finally {
        llmsWriter.close();
        llmsFullWriter.close();
    }
}

async function main() {
    const args = Deno.args;
    const skipFolderIndex = args.indexOf("--skip");

    let input: string | undefined;
    let localDocsDir = "";
    let llmsFile: string | undefined;
    let llmsFullFile: string | undefined;
    let skipFolders: string[] = [];

    if (skipFolderIndex !== -1) {
        skipFolders = args.slice(skipFolderIndex + 1);
        args.splice(skipFolderIndex);
    }

    if (args.length > 0) {
        input = args[0];
        if (args[1] && input !== "local") {
            llmsFile = args[1];
        } else if (args[1]) {
            localDocsDir = args[1];
        }
        if (args[2] && input === "local") {
            llmsFile = args[2];
        }
        if (args[3] && input === "local") {
            llmsFullFile = args[3];
        } else if (args[2] && input !== "local") {
            llmsFullFile = args[2];
        }
    }

    if (!llmsFile) {
        llmsFile = "llms.txt";
    }
    if (!llmsFullFile) {
        llmsFullFile = "llms-full.txt";
    }

    if (!input) {
        console.log(
            "Usage (local):  deno docs2llms.ts local <local_directory> [llms_txt] [llms_full_txt] [--skip <folder1> <folder2> ...]"
        );
        console.log(
            "Usage (remote): deno docs2llms.ts <remote_directory> [llms_txt] [llms_full_txt] [--skip <folder1> <folder2> ...]"
        );
        Deno.exit(1);
    }

    const token = Deno.env.get("GITHUB_TOKEN") || undefined;

    try {
        if (input === "local") {
            await processLocalDirectory(
                localDocsDir,
                llmsFile,
                llmsFullFile,
                skipFolders
            );
            console.log(`\n✅ ${llmsFile}`);
            console.log(`\n✅ ${llmsFullFile}`);
        } else if (validateGitHubURL(input)) {
            const { owner, repo, branch, path } = parseGitHubURL(input);

            console.log(`\nRepository: ${owner}/${repo}`);
            console.log(`Branch: ${branch}`);
            console.log(`Path: ${path}`);

            if (!token) {
                console.log(
                    "\n⚠️ GitHub token not found. Rate limit is restricted to 60 requests per hour.\n"
                );
            }

            await processDirectory(
                owner,
                repo,
                branch,
                path,
                llmsFile,
                llmsFullFile,
                token,
                skipFolders
            );
            console.log(`\n✅ ${llmsFile}`);
            console.log(`\n✅ ${llmsFullFile}`);
        } else {
            console.log(
                '⚠️ Invalid input. Provide a valid GitHub URL or use "local".'
            );
            Deno.exit(1);
        }
    } catch (error) {
        console.error("Error:", error);
        Deno.exit(1);
    }
}

if (import.meta.main) {
    main();
}
