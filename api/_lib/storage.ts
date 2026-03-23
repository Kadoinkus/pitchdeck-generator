import path from 'node:path';

export function getOutputDir(): string {
	const override = process.env.PITCHDECK_OUTPUT_DIR;
	if (typeof override === 'string' && override !== '') {
		return override;
	}

	return path.join('/tmp', 'pitchdeck-generator');
}
