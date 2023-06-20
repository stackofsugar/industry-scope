/// <reference path="F:/References/jquery-3.7.0.min.js" />
var kelurahan = ["Banjarsari", "Jebres", "Laweyan", "Pasar Kliwon", "Serengan"];

$(() => {
    var dataset = (() => {
        var json = null;
        $.ajax({
            async: false,
            global: false,
            url: "https://cdn.jsdelivr.net/gh/stackofsugar/industry-scope/data/dataset.json",
            dataType: "json",
            success: function (data) {
                json = data;
            },
        });
        return json;
    })();

    var test_kbli = 13;

    
});
