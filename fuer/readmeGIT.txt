heroku keys:add
git remote -v

heroku logs -t

 heroku maintenance:on

heroku restart -a app_name

git init
git add .
git commit -m "abc"
heroku git:remote -a nameapp
git push heroku master -f