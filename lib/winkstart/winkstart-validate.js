(function(winkstart, amplify, undefined) {
    winkstart.validate = function(obj, schema, $form, success, failure) {
        var env = JSV.createEnvironment("json-schema-draft-03"),
            res = env.validate(obj, schema);

        if(res.errors.length === 0) {
            if(typeof success == 'function') {
                success(obj);
            }
        } else {
            $('.clearfix.error', $form)
                    .removeClass('error')
                    .find('.help-inline')
                    .text('');

            $.each(res.errors, function(k, err) {
                var properties = err.uri.split('#'),
                    selector = "";

                properties = properties[1].split('/').splice(1);

                $.each(properties, function(i, v) {
                    if(i == 0){
                        selector += v;
                    } else {
                        selector += '.' + v;
                    }
                });

                $('[name="' + selector + '"]', $form)
                    .parents('.clearfix')
                    .addClass('error')
                    .find('.help-inline')
                    .text(err.message + ' (' + err.details + ')');
            });

            if(typeof failure == 'function') {
                failure(res.errors, obj);
            }
        }
    };

})( window.winkstart = window.winkstart || {}, window.amplify = window.amplify || {});
