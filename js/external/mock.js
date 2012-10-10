$.mockjax('api/v2/authenticate/establish', {
	proxy: 'module/auth/mock/auth.establish-success.json'
});
$.mockjax('api/v2/authenticate/destroy', {
	proxy: 'module/auth/mock/auth.destroy-success.json'
});