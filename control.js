control = {

    count: 1,
    guardian: {
            key: null
        },

    init: function(key) {

        //  if we have been passed over a null key, then don't do anything
        if (key === null) {
            return;
        }

        //  otherwise setup all the things!!
        this.guardian.key = key;

        this.count = 6;

    }

}
