        var OAUTHURL    =   'https://accounts.google.com/o/oauth2/auth?';
        var VALIDURL    =   'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=';
        var SCOPE       =   'https://www.googleapis.com/auth/drive';
        var CLIENTID    =   '280286530527-lh0iqa2kh1r9si7v7v84ldn181n4caca.apps.googleusercontent.com';
        var REDIRECT    =   'http://localhost:3000/addDrive/google/'
        var LOGOUT      =   'http://accounts.google.com/Logout';
        var TYPE        =   'token';
        //var _url        =   OAUTHURL + 'scope=' + SCOPE + '&client_id=' + CLIENTID + '&redirect_uri=' + REDIRECT + '&response_type=' + TYPE;
        var _url ='https://accounts.google.com/o/oauth2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&response_type=code&client_id=280286530527-lh0iqa2kh1r9si7v7v84ldn181n4caca.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2FaddDrive%2Fgoogle'
        var acToken;
        var tokenType;
        var expiresIn;
        var user;
        var loggedIn    =   false;

        function login() {
            var win         =   window.open(_url, "windowname1", 'width=800, height=600'); 

            var pollTimer   =   window.setInterval(function() { 
                try {
                    console.log(win.document.URL);
                    if (win.document.URL.indexOf(REDIRECT) != -1) {
                        console.log(win.document.URL.indexOf(REDIRECT) );
                        window.clearInterval(pollTimer);
                        var url =   win.document.URL;
                        acToken =   gup(url, 'access_token');
                        tokenType = gup(url, 'token_type');
                        expiresIn = gup(url, 'expires_in');
                        win.close();

                        validateToken(acToken);
                    }
                } catch(e) {
                }
            }, 500);
        }

        function validateToken(token) {
            $.ajax({
                url: VALIDURL + token,
                data: null,
                success: function(responseText){  
                    loggedIn = true;
                    $('#loginText').hide();
                    $('#logoutText').show();
                },  
                dataType: "jsonp"  
            });
        }


        //credits: http://www.netlobo.com/url_query_string_javascript.html
        function gup(url, name) {
            name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
            var regexS = "[\\#&]"+name+"=([^&#]*)";
            var regex = new RegExp( regexS );
            var results = regex.exec( url );
            if( results == null )
                return "";
            else
                return results[1];
        }

        function startLogoutPolling() {
            $('#loginText').show();
            $('#logoutText').hide();
            loggedIn = false;
        }