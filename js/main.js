
require.config({
	paths: {
		handlebars: "js/lib/handlebars-1.0.10",
		jquery: "js/lib/jquery-1.9.1.min",
		monster: "js/lib/monster",
		plugins: "js/plugins",
		postal: "js/lib/postal-0.8.2.min",
		amplify: "js/lib/amplify-1.1.0.min",
		underscore: "js/lib/underscore-1.4.4.min"
	},
  shim: {
		amplify: {
			deps: ["jquery"],
			exports: "amplify"
		}, 	
		handlebars: {
			exports: "Handlebars"
		},
  	plugins: ["jquery"],
  	underscore: {
  		exports: '_'
		}
  },
  urlArgs: "bust=" + (new Date()).getTime()
});

require(["jquery", "monster"], function($, monster){

	$.support.cors = true;
	$(function(){ 
		monster._loadApp("core", function(app){
			console.log("core loaded");
			app.render(function(template){
				$('#main section').append(template);
			});
		});
	});

});
