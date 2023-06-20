/// <reference path="F:/References/jquery-3.7.0.min.js" />
var kelurahan = ["Banjarsari", "Jebres", "Laweyan", "Pasar Kliwon", "Serengan"];

$(() => {
    $.getJSON("dataset.json", (data) => {
        console.log(data);
    });
    console.log();
});
