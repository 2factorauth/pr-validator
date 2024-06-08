import { Router } from 'itty-router';
import twofactorauth from './twofactorauth';
import passkeys from './passkeys';

export default {
	async fetch(request, env) {
		return router.handle(request, env);
	}
};

const router = Router();

router.get('/:repo/:pr/', async (req, env) => {
	const { repo } = req.params;
	switch (repo) {
		case 'twofactorauth':
			return twofactorauth(req, env);
		case 'passkeys':
			// return passkeys(req, env);
			return new Response('Not Implemented', { status: 501 });
	}
});

router.all('*', () => new Response('Not Found.', { status: 404 }));
