/// <reference path="F:/References/jquery-3.7.0.min.js" />
/// <reference path="F:/References/linear-algebra.min.js" />
var dataset = null;

$(() => {
    dataset = (() => {
        var json = null;
        $.ajax({
            async: false,
            global: false,
            url: "https://cdn.jsdelivr.net/gh/stackofsugar/industry-scope@master/data/dataset.json",
            dataType: "json",
            success: function (data) {
                json = data;
            },
        });
        return json;
    })();
});

function handleFindLocations() {
    chosen_segment = $("#business-segment").val();

    if (chosen_segment == "0") {
        alert("You should pick a business segment!");
        return;
    }

    $("#result-spinner").removeClass("d-none");
    $("#find-button").attr("disabled", true);
    $("#result-table-body").empty();

    var kbli_string = {
        ni: String(chosen_segment) + "_ni",
        aw: String(chosen_segment) + "_aw",
    };
    var data_usable = dataset
        .map((val) => {
            if (val[kbli_string.ni] != 0) {
                return [val.kecamatan, val.kelurahan, [val[kbli_string.ni], val[kbli_string.aw]]];
            }
        })
        .filter(Boolean);

    var weights = [0.7, 0.3];
    var loss = ["max", "max"];
    Matrix = linearAlgebra().Matrix;
    data_matrix = new Matrix(data_usable.map((v) => v[2]));
    result = topsis(data_matrix, weights, loss, data_usable);
    console.log("Result:", result);

    result.forEach((val, i) => {
        $("#result-table-body").append(`
            <tr>
                <th scope="row">${i + 1}</th>
                <td>${val.region}</td>
                <td>${val.score}</td>
            </tr>
        `);
    });

    $("#result-spinner").addClass("d-none");
    $("#find-button").removeAttr("disabled");
    $("#result-table").removeClass("d-none");
}

function sortedBy(elm) {
    return function order(a, b) {
        if (b[elm] > a[elm]) {
            return 1;
        }
        if (b[elm] < a[elm]) {
            return -1;
        }
        return 0;
    };
}

function topsis(m, w, ia, mapped_data) {
    if (!m.data) {
        alert("ERROR. Matrix argument MUST be a linear-algebra module matrix.");
        return;
    }
    if (Array.isArray(ia) === false) {
        alert("ERROR. Impact argument MUST be an array.");
        return;
    }
    if (ia.length !== m.cols) {
        alert("ERROR. Impact argument size MUST be equal to Alternative Matrix columns size.");
        return;
    }
    if (ia.every((i) => typeof i === "string") === false) {
        alert("ERROR. Impact argument MUST contain string type elements.");
        return;
    }

    const c1 = ia.indexOf("max") > -1;
    const c2 = ia.indexOf("min") > -1;
    if (!(c1 || c2)) {
        alert('ERROR. Impact argument MUST contain string type element exactly named "max" or "min" accordingly.');
        return;
    }
    if (Array.isArray(w) === false) {
        alert("ERROR. Weights argument MUST be an array.");
        return;
    }
    if (w.length !== m.cols) {
        alert("ERROR. Weights argument size MUST be equal to Alternative Matrix columns size.");
        return;
    }

    let i = 0;

    for (i = 0; i < m.cols; i += 1) {
        if (w[i] > 1) {
            alert("ERROR. The value from an element in the weights argument cannot be higher than 1.");
            return;
        }
    }

    function add(a, b) {
        return a + b;
    }

    if (w.reduce(add, 0) > 1) {
        alert("ERROR. Elements from the weights argument must sum exactly 1.");
        return;
    }

    // Calculating norm
    let j; // Cols
    i = 0; // Rows
    let norm = 0;
    const normArray = [];

    for (j = 0; j < m.cols; j += 1) {
        for (i = 0; i < m.rows; i += 1) {
            const num = m.data[i][j];
            norm = num ** 2 + norm;
        }

        norm = Math.round(Math.sqrt(norm) * 100) / 100;
        normArray.push(norm);
        norm = 0;
    }

    let mNormArray = [];
    i = 0;

    for (i = 0; i < m.rows; i += 1) {
        mNormArray.push(normArray);
    }

    mNormArray = new Matrix(mNormArray);

    // Normalised Alternative Matrix

    let nm = [];
    nm = m.div(mNormArray);

    // Weighted normalised alternative matrix
    let ev = [];
    i = 0;
    for (i = 0; i < m.rows; i += 1) {
        ev.push(w);
    }

    ev = new Matrix(ev);

    const wnm = nm.mul(ev);

    // Computing ideal and anti-ideal solution

    i = 0; // Rows
    j = 0; // Columns
    let a = 0; // iterations
    let attributeValues = [];
    const idealSolution = [];
    const aidealSolution = [];
    let attributeFunction = null;

    for (a = 0; a < 2; a += 1) {
        for (j = 0; j < m.cols; j += 1) {
            for (i = 0; i < m.rows; i += 1) {
                attributeValues.push(wnm.data[i][j]);
            }

            if (a === 0) {
                if (ia[j] === "min") {
                    attributeFunction = Math.min(...attributeValues);
                    idealSolution.push(attributeFunction);
                } else if (ia[j] === "max") {
                    attributeFunction = Math.max(...attributeValues);
                    idealSolution.push(attributeFunction);
                }
            } else if (a === 1) {
                if (ia[j] === "min") {
                    attributeFunction = Math.max(...attributeValues);
                    aidealSolution.push(attributeFunction);
                } else if (ia[j] === "max") {
                    attributeFunction = Math.min(...attributeValues);
                    aidealSolution.push(attributeFunction);
                }
            }

            attributeValues = [];
        }
        j = 0;
    }

    // Calculate distance to ideal and antiideal solution
    i = 0; // Rows
    j = 0; // Cols
    a = 0;

    const listIdeal = [];
    const listaIdeal = [];
    let distToI = 0;
    let distToaI = 0;

    for (a = 0; a < 2; a += 1) {
        for (i = 0; i < m.rows; i += 1) {
            distToI = 0;
            distToaI = 0;
            for (j = 0; j < m.cols; j += 1) {
                if (a === 0) {
                    distToI += (wnm.data[i][j] - idealSolution[j]) ** 2;
                } else {
                    distToaI += (wnm.data[i][j] - aidealSolution[j]) ** 2;
                }
            }

            if (a === 0) {
                distToI = Math.sqrt(distToI);
                listIdeal.push(distToI);
            } else {
                distToaI = Math.sqrt(distToaI);
                listaIdeal.push(distToaI);
            }
        }
    }

    i = 0;
    const listedPerformancedScore = [];
    let performanceScore = null;
    for (i = 0; i < m.rows; i += 1) {
        performanceScore = listaIdeal[i] / (listIdeal[i] + listaIdeal[i]);
        listedPerformancedScore.push(performanceScore);
    }

    const indexedPerformanceScore = [];
    i = 0;
    for (i = 0; i < m.rows; i += 1) {
        const dp = {
            index: i,
            data: m.data[i],
            ps: listedPerformancedScore[i],
        };
        indexedPerformanceScore.push(dp);
    }
    var rankedPerformanceScore = indexedPerformanceScore.sort(sortedBy("ps"));

    rankedPerformanceScore = rankedPerformanceScore.map((v) => {
        return { data: v.data, ps: v.ps };
    });

    var mappedRankedPerfScore = rankedPerformanceScore.map((v) => {
        var kelurahan = "";
        mapped_data.forEach((valMap) => {
            if (v.data.toString() === valMap[2].toString()) {
                kecamatan = valMap[0];
                kelurahan = valMap[1];
            }
        });

        return {
            region: String(kelurahan + ", " + kecamatan),
            score: (v.ps * 100).toFixed(2),
        };
    });
    return mappedRankedPerfScore;
}
