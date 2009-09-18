# -*- coding: UTF-8 -*-

import os
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app

class DemoPage(webapp.RequestHandler):
    def get(self):
        page = self.request.get('page')
        if not page:
            path = os.path.join(os.path.dirname(__file__), 'demo.html')
            return self.response.out.write(template.render(path, {}))
        else:
            page = int(page)
            return self.response.out.write(u"<p>Here is page %s.</p>" % page)

def Demo():
    application = webapp.WSGIApplication([('/demo', DemoPage),], debug=True)
    run_wsgi_app(application)

if __name__ == "__main__":
    Demo()
