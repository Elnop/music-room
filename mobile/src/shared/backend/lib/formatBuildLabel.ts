export function formatBuildLabel(version: string, buildNumber?: string, commit?: string): string {
	if (!buildNumber) return `Zumik ${version} (dev)`;
	return commit
		? `Zumik ${version} (build ${buildNumber} · ${commit})`
		: `Zumik ${version} (build ${buildNumber})`;
}
