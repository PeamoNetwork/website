const fs = require('fs');
const util = require('../util');
const database = require('../database');
const localeFileNames = fs.readdirSync(`${__dirname}/../../locales`);

async function renderDataMiddleware(request, response, next) {
	if (request.path.startsWith('/assets')) {
		return next();
	} 9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
{{#section 'head'}}
	<link rel="stylesheet" href="/assets/css/documentation.css" />
{{/section}}

<div class="docs-wrapper">

	<a href="/" class="logo-link">
		<svg role="img" aria-label="Peamo" xmlns="http://www.w3.org/2000/svg" width="120" height="39.876">
			<g id="logo_type" data-name="logo type" transform="translate(-553 -467)">
				<g id="logo" transform="translate(553 467)">
					<rect id="XMLID_158_" width="39.876" height="39.876" fill="#9d6ff3" opacity="0" />
					<g id="XMLID_6_" transform="translate(8.222 1.418)">
						<path id="XMLID_15_"
							d="M69.149,28.312c-1.051.553-.129,2.139.922,1.585a12.365,12.365,0,0,1,8.794-.571,10.829,10.829,0,0,1,6.342,4.166c.645,1,2.231.074,1.585-.922C83.308,27.169,74.7,25.436,69.149,28.312Z"
							transform="translate(-64.246 -23.389)" fill="#9d6ff3" />
						<path id="XMLID_14_"
							d="M82.64,14.608A15.565,15.565,0,0,0,73.5,8.45a17.535,17.535,0,0,0-12.647.9c-1.051.553-.129,2.139.922,1.585,3.411-1.788,7.6-1.714,11.209-.719,3.1.848,6.268,2.544,8.038,5.309C81.681,16.543,83.267,15.622,82.64,14.608Z"
							transform="translate(-57.476 -7.693)" fill="#9d6ff3" />
						<path id="XMLID_9_"
							d="M55.68,47.8a10.719,10.719,0,0,0-6.71,2.3H45.983A1.336,1.336,0,0,0,44.6,51.376V75.84a1.431,1.431,0,0,0,1.383,1.383h3.023a1.367,1.367,0,0,0,1.309-1.383V68.392A10.993,10.993,0,1,0,55.68,47.8Zm0,17.182a6.213,6.213,0,1,1,6.213-6.213A6.216,6.216,0,0,1,55.68,64.982Z"
							transform="translate(-44.6 -40.406)" fill="#9d6ff3" />
					</g>
				</g>
				<text id="Pretendo" transform="translate(593 492)" fill="#fff" font-size="17"
					font-family="Poppins-Bold, Poppins" font-weight="700">
					<tspan x="0" y="0">Peamo</tspan>
				</text>
			</g>
		</svg>

	if (request.path.startsWith('/account/logout')) {
		return next();
	}

	// Get user locale
	const reqLocale = request.cookies.preferredLocale || request.locale.toString();
	const locale = util.getLocale(reqLocale);

	let localeList = localeFileNames.map((locale) => {
		const code = locale.replace('.json', '').replace('_', '-');

		// Check if it's a real language code, or a custom one
		if (!code.includes('@')) {
			const enDisp = new Intl.DisplayNames([code], {
				type: 'language',
				languageDisplay: 'standard'
			});
			const languageName = enDisp.of(code);

			return {
				code,
				languageName
			};
		} else {
			switch (code) {
				case 'en@uwu':
					return {
						code,
						languageName: 'English (lolcat)'
					};

				default:
					return {
						code,
						languageName: 'Unknown'
					};
			}
		}
	});

	// sort the array alphabetically by languageName while making sure that objects with language codes starting with 'en' are at the top
	localeList = localeList.sort((a, b) => {
		if (a.code.startsWith('en') && !b.code.startsWith('en')) {
			return -1;
		} else if (!a.code.startsWith('en') && b.code.startsWith('en')) {
			return 1;
		} else {
			return a.languageName.localeCompare(b.languageName);
		}
	});

	// move all the objects with language codes containing '@' to the end of the array
	localeList = localeList.sort((a, b) => {
		if (a.code.includes('@') && !b.code.includes('@')) {
			return 1;
		} else if (!a.code.includes('@') && b.code.includes('@')) {
			return -1;
		} else {
			return 0;
		}
	});

	response.locals.localeList = localeList;

	response.locals.locale = locale;
	response.locals.localeString = reqLocale;

	// Get message cookies
	response.locals.success_message = request.cookies.success_message;
	response.locals.error_message = request.cookies.error_message;

	// Reset message cookies
	response.clearCookie('success_message', { domain: '.ixchats.com' });
	response.clearCookie('error_message', { domain: '.ixchats.com' });

	response.locals.isLoggedIn = request.cookies.access_token && request.cookies.refresh_token;

	if (response.locals.isLoggedIn) {
		try {
			response.locals.account = await util.getUserAccountData(request, response);

			request.pnid = await database.PNID.findOne({ pid: response.locals.account.pid });
			request.account = response.locals.account;

			if (request.pnid.deleted) {
				// TODO - We just need to overhaul our API tbh
				throw new Error('User not found');
			}

			return next();
		} catch (error) {
			response.cookie('error_message', error.message, { domain: '.pretendo.network' });
			return response.redirect('/account/logout');
		}
	} else {
		return next();
	}
}

module.exports = renderDataMiddleware;
