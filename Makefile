deploy:
	-heroku create awesomemes --stack cedar
	-heroku addons:add redistogo:mini
	-heroku addons:add custom_domains:basic
	-heroku addons:add zerigo_dns:basic
	-heroku config:add LD_PRELOAD='/app/node_modules/canvas/cairo/libcairo.so /app/node_modules/canvas/lib/libpixman-1.so.0 /app/node_modules/canvas/lib/libfreetype.so.6' --app awesomemes
	-heroku config:add LD_LIBRARY_PATH'=/app/node_modules/canvas/cairo' --app awesomemes
	-git push heroku master

renew:
	-heroku domains:clear
	-heroku domains:add awesomem.es
	-heroku domains:add www.awesomem.es

destroy:
	-git remote rm heroku
	-heroku destroy --confirm awesomemes

doomsday: destroy renew deploy
