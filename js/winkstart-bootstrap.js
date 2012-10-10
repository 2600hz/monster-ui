(function(Handlebars, winkstart) {
    Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
        var operators, result;

        if (arguments.length < 3) {
            throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
        }

        if (options === undefined) {
            options = rvalue;
            rvalue = operator;
            operator = "===";
        }

        operators = {
            '==': function (l, r) { return l == r; },
            '===': function (l, r) { return l === r; },
            '!=': function (l, r) { return l != r; },
            '!==': function (l, r) { return l !== r; },
            '<': function (l, r) { return l < r; },
            '>': function (l, r) { return l > r; },
            '<=': function (l, r) { return l <= r; },
            '>=': function (l, r) { return l >= r; },
            'typeof': function (l, r) { return typeof l == r; }
        };

        if (!operators[operator]) {
            throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
        }

        result = operators[operator](lvalue, rvalue);

        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    /* We initialize the i18n library in order to be able to use the Handlebar helper */
    i18n.init({
            resStore: {},
            lng: winkstart.config.language || 'en',
            fallbackLng: winkstart.config.fallback_language || 'en'
        },
        function(t) {
            Handlebars.registerHelper('t', function(i18n_key, default_value) {
                var default_value = typeof default_value === 'string' ? default_value : 'key not found',
                    result = i18n_key ? i18n.t(i18n_key, { defaultValue: default_value }) : default_value;

                return new Handlebars.SafeString(result);
            });

            Handlebars.registerHelper('t_var', function(i18n_key, variable) {
                var default_value = 'key not found',
                    result = i18n_key ? i18n.t(i18n_key, { variable: variable, defaultValue: default_value }) : default_value;

                return new Handlebars.SafeString(result);
            });
        }
    );

})(Handlebars, winkstart ||{});
