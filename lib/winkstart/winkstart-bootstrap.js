(function(Handlebars, winkstart) {
    Handlebars.registerHelper('eachkeys', function(context, options) {
        var fn = options.fn,
            inverse = options.inverse,
            ret = '',
            empty = true;

        for (key in context) { empty = false; break; }

        if (!empty) {
            for (key in context) {
                ret = ret + fn({ 'key': key, 'value': context[key]});
            }
        }
        else {
            ret = inverse(this);
        }

        return ret;
    });

    Handlebars.registerHelper('format_phone_number', function(phone_number) {
        phone_number = phone_number.toString();

        if(phone_number.substr(0,2) === "+1" && phone_number.length === 12) {
            phone_number = phone_number.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
        }

        return phone_number;
    });

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
            Handlebars.registerHelper('t', function(i18n_key, _variable) {
                var default_value = 'key not found',
                    result;

                if(_variable && _variable !== '') {
                    result = i18n_key ? i18n.t(i18n_key, { variable: _variable, defaultValue: default_value }) : default_value;
                }
                else {
                    result = i18n_key ? i18n.t(i18n_key, { defaultValue: default_value }) : default_value;
                }

                return new Handlebars.SafeString(result);
            });
        }
    );
})(Handlebars, winkstart ||{});
