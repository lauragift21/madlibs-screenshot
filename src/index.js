import puppeteer from '@cloudflare/puppeteer';
import sanitize from 'sanitize-filename'
import { nanoid } from 'nanoid'

export default {
	async fetch(request, env, ctx) {
		const { searchParams } = new URL(request.url);
		let url = searchParams.get("url");
		let img
		if (url) {
			const browser = await puppeteer.launch(env.MYBROWSER);
			const page = await browser.newPage();
			await page.goto(url);
			img = (await page.screenshot({ fullPage: true }));
			const title = sanitize(await page.title(), { replacement: '-' })
			const id = nanoid(5)

			const titleString = `${title}_${id}.jpg`;
			await browser.close();
			// store image in R2 bucket
			try {
				await env.R2BUCKET.put(titleString, img);
				return Response.redirect(`${env.bucketUrl}/${titleString}`, 307);
			} catch (e) {
				return new Response(e, { status: 400 })
			}
		} else {
			return new Response(
				"Please add the ?url=https://example.com/ parameter"
			);
		}
	},
};
