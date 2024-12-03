#!/usr/bin/env

import { basename, join, relative } from "https://deno.land/std/path/mod.ts";

function validateURL(url: string, pattern: RegExp): boolean {
  return pattern.test(url);
}

interface RepositoryURL {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

function parseURL(url: string, baseUrl: string): RepositoryURL {
  let owner,
    repo,
    branch = "main",
    path = "";
  if (url.startsWith(baseUrl)) {
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
  skipFolders: string[] = [],
  maxSize: number = Infinity,
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
        [".md", ".mdx", ".txt", ".rst"].some((ext) => entry.name.endsWith(ext))
      ) {
        const fileInfo = await Deno.stat(fullEntryPath);
        if (fileInfo.size <= maxSize * 1024 * 1024) {
          const relativePath = relative(basePath, fullEntryPath);
          files.push(relativePath);
          fullPaths.push(fullEntryPath);
        }
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
  fullPaths: string[],
  outputDir: string,
) {
  const llmsFilePath = join(outputDir, llmsFile);
  const llmsFullFilePath = join(outputDir, llmsFullFile);

  const llmsWriter = await Deno.open(llmsFilePath, {
    create: true,
    truncate: true,
    write: true,
  });
  const llmsFullWriter = await Deno.open(llmsFullFilePath, {
    create: true,
    truncate: true,
    write: true,
  });

  try {
    await llmsWriter.write(new TextEncoder().encode(`# \n\n`));

    for (const file of files) {
      await llmsWriter.write(
        new TextEncoder().encode(`- [${basename(file)}](${file})\n`),
      );
    }

    for (const fullPath of fullPaths) {
      const fileContent = await Deno.readTextFile(fullPath);
      await llmsFullWriter.write(
        new TextEncoder().encode(fileContent + "\n\n"),
      );
    }
  } finally {
    llmsWriter.close();
    llmsFullWriter.close();
  }
}

function previewMap(files: string[]) {
  const map: { [key: string]: string[] } = {};

  files.forEach((file) => {
    const parts = file.split("/");
    const dir = parts.slice(0, -1).join("/") || ".";
    const fileName = parts[parts.length - 1];

    if (!map[dir]) {
      map[dir] = [];
    }
    map[dir].push(fileName);
  });

  console.log("📂 Preview Map:");
  for (const dir in map) {
    console.log(`\n${dir}/`);
    map[dir].forEach((file) => {
      console.log(`  - ${file}`);
    });
  }
}

async function analyzeFiles(files: string[], fullPaths: string[]) {
  let totalWords = 0;
  let totalSize = 0;

  for (const fullPath of fullPaths) {
    const fileContent = await Deno.readTextFile(fullPath);
    const wordCount = fileContent.split(/\s+/).length;
    const fileInfo = await Deno.stat(fullPath);

    totalWords += wordCount;
    totalSize += fileInfo.size;
  }

  const averageSize = totalSize / files.length / (1024 * 1024);

  console.log(`\n📊 Analysis Report:`);
  console.log(`Total files: ${files.length}`);
  console.log(`Total words: ${totalWords}`);
  console.log(`Average file size: ${averageSize.toFixed(2)} MB`);
  console.log(
    `\nUse the --preview option to view content in the terminal before processing.`,
  );
}

async function main() {
  const args = Deno.args;

  let localDocsDir = "";
  let llmsBaseName = "llms";
  let llmsFullBaseName = "llms-full";
  let format = "txt";
  const skipFolders: string[] = [];
  let githubUrl = "";
  let gitlabUrl = "";
  let branch = "main";
  let preview = false;
  let interactive = false;
  let summary = false;
  let analyze = false;
  let maxSize = Infinity;
  let outputDir = ".";

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
      case "--summary":
        summary = true;
        break;
      case "--analyze":
        analyze = true;
        break;
      case "--max-size":
        maxSize = parseFloat(args[++i]);
        break;
      case "--github":
        if (
          validateURL(
            args[++i],
            /^(https:\/\/github\.com\/|[^/]+\/[^/]+$)/,
          )
        ) {
          githubUrl = args[i].startsWith("https://github.com/")
            ? args[i]
            : `https://github.com/${args[i]}`;
        }
        break;
      case "--gitlab":
        if (
          validateURL(
            args[++i],
            /^(https:\/\/gitlab\.com\/|[^/]+\/[^/]+$)/,
          )
        ) {
          gitlabUrl = args[i].startsWith("https://gitlab.com/")
            ? args[i]
            : `https://gitlab.com/${args[i]}`;
        }
        break;
      case "--branch":
        branch = args[++i];
        break;
      case "--output-dir":
        outputDir = args[++i];
        break;
    }
  }

  const llmsFile = `${llmsBaseName}.${format}`;
  const llmsFullFile = `${llmsFullBaseName}.${format}`;

  if (!localDocsDir && !githubUrl && !gitlabUrl) {
    console.log(`
Usage (local):  docs2llms --local /path/to/directory
Usage (remote): docs2llms --github username/repository
                docs2llms --gitlab username/repository

--llms: Output file for extracted content hyperlinks. Defaults to llms.txt.
--llms-full: Output file for processed content. Defaults to llms-full.txt.
--format: Format of the processed content. Available: txt, md, rst. Defaults to txt.
--branch: The repository branch to clone from. Defaults to main.
--output-dir: The output directory of the processed content. Defaults to the current directory.
--skip: Folders to skip during processing.
--summary: Display a summary of the processed content.
--analyze: Analysis report of the content (file and word counts, average file size).
--preview: Preview the content in the terminal before processing.
--interactive: Manually select and confirm each file to be processed.
            `);
    Deno.exit(1);
  }

  if (
    (preview || interactive) &&
    (summary ||
      analyze ||
      maxSize !== Infinity ||
      skipFolders.length > 0 ||
      llmsBaseName !== "llms" ||
      llmsFullBaseName !== "llms-full" ||
      format !== "txt" ||
      branch !== "main" ||
      outputDir !== ".")
  ) {
    console.log(
      "⚠️ The --preview and --interactive options cannot be combined with other options.",
    );
    Deno.exit(1);
  }

  try {
    let dirPath: string;
    if (localDocsDir) {
      dirPath = localDocsDir;
    } else if (githubUrl) {
      const {
        owner,
        repo,
        branch: urlBranch,
        path,
      } = parseURL(githubUrl, "https://github.com/");
      dirPath = await cloneRepository(
        `https://github.com/${owner}/${repo}.git`,
        branch || urlBranch,
      );

      if (path) {
        dirPath = join(dirPath, path);
      }
    } else if (gitlabUrl) {
      const {
        owner,
        repo,
        branch: urlBranch,
        path,
      } = parseURL(gitlabUrl, "https://gitlab.com/");
      dirPath = await cloneRepository(
        `https://gitlab.com/${owner}/${repo}.git`,
        branch || urlBranch,
      );

      if (path) {
        dirPath = join(dirPath, path);
      }
    } else {
      console.log(
        '⚠️ Invalid input. Provide a valid GitHub or GitLab URL, or use "--local".',
      );
      Deno.exit(1);
    }

    const { files, fullPaths } = await getDirectory(
      dirPath,
      dirPath,
      skipFolders,
      maxSize,
    );

    if (preview) {
      previewMap(files);
    } else if (interactive) {
      const confirmFiles: string[] = [];
      const confirmFullPaths: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fullPath = fullPaths[i];
        const userInput = prompt(
          `(${i + 1}/${files.length}): ${file}? (y/n)`,
        );
        if (userInput?.toLowerCase() === "y") {
          confirmFiles.push(file);
          confirmFullPaths.push(fullPath);
        }
      }

      await writeFiles(
        llmsFile,
        llmsFullFile,
        confirmFiles,
        confirmFullPaths,
        outputDir,
      );

      console.log(`\n✅ ${llmsFile}`);
      console.log(`✅ ${llmsFullFile}`);
    } else {
      await writeFiles(
        llmsFile,
        llmsFullFile,
        files,
        fullPaths,
        outputDir,
      );

      console.log(`\n✅ ${llmsFile}   ✅ ${llmsFullFile}`);
    }

    if (summary) {
      console.log("📄 Summary:");
      console.log("🗂️ :", files);
    }

    if (analyze) {
      await analyzeFiles(files, fullPaths);
    }

    if ((githubUrl || gitlabUrl) && !preview && !interactive) {
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
