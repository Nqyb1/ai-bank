// ============================================================
// CENTRAL BANK AI
// TensorFlow.js
// ============================================================


// ============================================================
// القوائم
// ============================================================

const TRADING = [
    "USDT",
    "SOL",
    "BNB",
    "XRP",
    "ADA",
    "USDC",
    "BTC",
    "ETH",
    "TRX"
];


const INVESTMENT = [
    "Microsoft",
    "Apple",
    "Tesla",
    "Amazon",
    "Google",
    "Discord",
    "Facebook",
    "TikTok",
    "Starbucks"
];


// ============================================================
// الحالة
// ============================================================

let currentType = null;

let currentAsset = null;

let currentPrediction = null;

let currentPercentages = [];


// ============================================================
// التخزين
//
// لكل أصل سجل منفصل.
// ============================================================

let database =
    JSON.parse(
        localStorage.getItem(
            "centralBankAI"
        )
    ) || {};


// ============================================================
// حفظ البيانات
// ============================================================

function saveDatabase() {

    localStorage.setItem(
        "centralBankAI",
        JSON.stringify(database)
    );

}


// ============================================================
// مفتاح مستقل لكل أصل
// ============================================================

function assetKey() {

    return (
        currentType +
        "::" +
        currentAsset
    );

}


// ============================================================
// إنشاء بيانات الأصل
// ============================================================

function getData() {

    const key =
        assetKey();


    if (!database[key]) {

        database[key] = {

            history: [],

            modelData: []

        };

        saveDatabase();

    }


    return database[key];

}


// ============================================================
// الصفحات
// ============================================================

function hideAll() {

    document
        .querySelectorAll("section")
        .forEach(
            section =>
                section.classList.add(
                    "hidden"
                )
        );

}


function showHome() {

    hideAll();

    document
        .getElementById("home")
        .classList.remove(
            "hidden"
        );

}


function showAssets() {

    hideAll();

    document
        .getElementById("assets")
        .classList.remove(
            "hidden"
        );

}


function showInput() {

    hideAll();

    document
        .getElementById("input")
        .classList.remove(
            "hidden"
        );

}


// ============================================================
// اختيار النظام
// ============================================================

function chooseType(type) {

    currentType = type;

    hideAll();

    document
        .getElementById("assets")
        .classList.remove(
            "hidden"
        );


    const title =
        document.getElementById(
            "assetTitle"
        );


    if (
        type === "trading"
    ) {

        title.textContent =
            "💹 اختر أصل التداول";

        createAssets(
            TRADING
        );

    } else {

        title.textContent =
            "📈 اختر شركة الاستثمار";

        createAssets(
            INVESTMENT
        );

    }

}


// ============================================================
// إنشاء الأصول
// ============================================================

function createAssets(
    assets
) {

    const container =
        document.getElementById(
            "assetButtons"
        );


    container.innerHTML = "";


    assets.forEach(
        (asset, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "asset";


            button.textContent =
                `${index + 1} - ${asset}`;


            button.onclick =
                () =>
                    chooseAsset(
                        asset
                    );


            container.appendChild(
                button
            );

        }
    );

}


// ============================================================
// اختيار أصل
// ============================================================

function chooseAsset(
    asset
) {

    currentAsset = asset;


    hideAll();


    document
        .getElementById("input")
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "selectedAsset"
        )
        .textContent =
            currentAsset;


    clearInputs();

}


// ============================================================
// تنظيف الحقول
// ============================================================

function clearInputs() {

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        document
            .getElementById(
                "p" + i
            )
            .value = "";

    }

}


// ============================================================
// قراءة النسب
// ============================================================

function readValues() {

    const values = [];


    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        const value =
            Number(
                document
                    .getElementById(
                        "p" + i
                    )
                    .value
            );


        if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > 100
        ) {

            alert(
                `النسبة رقم ${i} يجب أن تكون بين 0 و100`
            );

            return null;

        }


        values.push(
            value
        );

    }


    return values;

}


// ============================================================
// تحويل البيانات إلى Features
//
// نضيف الاتجاهات والفروقات بدل استخدام الأرقام
// الخام فقط.
// ============================================================

function makeFeatures(
    values
) {

    const average =
        values.reduce(
            (a, b) =>
                a + b,
            0
        ) / 5;


    const d1 =
        values[1] -
        values[0];

    const d2 =
        values[2] -
        values[1];

    const d3 =
        values[3] -
        values[2];

    const d4 =
        values[4] -
        values[3];


    const trend =
        (
            d1 +
            d2 +
            d3 +
            d4
        ) / 4;


    return [

        values[0] / 100,
        values[1] / 100,
        values[2] / 100,
        values[3] / 100,
        values[4] / 100,

        average / 100,

        d1 / 100,
        d2 / 100,
        d3 / 100,
        d4 / 100,

        trend / 100

    ];

}


// ============================================================
// بناء نموذج جديد
// ============================================================

function createModel() {

    const model =
        tf.sequential();


    model.add(
        tf.layers.dense({

            inputShape: [11],

            units: 32,

            activation: "relu"

        })
    );


    model.add(
        tf.layers.dense({

            units: 16,

            activation: "relu"

        })
    );


    model.add(
        tf.layers.dense({

            units: 8,

            activation: "relu"

        })
    );


    model.add(
        tf.layers.dense({

            units: 1,

            activation: "sigmoid"

        })
    );


    model.compile({

        optimizer:
            tf.train.adam(
                0.01
            ),

        loss:
            "binaryCrossentropy",

        metrics:
            ["accuracy"]

    });


    return model;

}


// ============================================================
// تدريب النموذج
//
// كل أصل يتدرب على بياناته فقط.
// ============================================================

async function trainModel(
    model,
    modelData
) {

    if (
        modelData.length < 10
    ) {

        return null;

    }


    const xs =
        modelData.map(
            item =>
                makeFeatures(
                    item.percentages
                )
        );


    const ys =
        modelData.map(
            item =>
                item.result === "ناجح"
                    ? 1
                    : 0
        );


    const xTensor =
        tf.tensor2d(
            xs
        );


    const yTensor =
        tf.tensor2d(
            ys.map(
                x => [x]
            )
        );


    const result =
        await model.fit(
            xTensor,
            yTensor,
            {

                epochs: 60,

                batchSize:
                    Math.min(
                        16,
                        modelData.length
                    ),

                shuffle: true,

                verbose: 0

            }
        );


    xTensor.dispose();

    yTensor.dispose();


    return result;

}


// ============================================================
// توقع
// ============================================================

async function predict() {

    const values =
        readValues();


    if (!values) {

        return;

    }


    currentPercentages =
        values;


    const data =
        getData();


    hideAll();


    document
        .getElementById("result")
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "prediction"
        )
        .textContent =
            "جاري تحليل البيانات...";


    document
        .getElementById(
            "confidence"
        )
        .textContent = "";


    document
        .getElementById(
            "modelInfo"
        )
        .textContent = "";


    // ========================================================
    // نحتاج بيانات كافية قبل استخدام ML
    // ========================================================

    if (
        data.modelData.length < 10
    ) {

        currentPrediction =
            basicPrediction(
                values
            );


        document
            .getElementById(
                "prediction"
            )
            .textContent =
                `التوقع: ${currentPrediction}`;


        document
            .getElementById(
                "prediction"
            )
            .className =
                currentPrediction === "ناجح"
                    ? "win"
                    : "loss";


        document
            .getElementById(
                "confidence"
            )
            .textContent =
                "النموذج يحتاج 10 نتائج مسجلة على الأقل قبل بدء التعلم الآلي.";


        document
            .getElementById(
                "modelInfo"
            )
            .textContent =
                `البيانات الحالية لهذا الأصل: ${data.modelData.length}`;

        return;

    }


    // ========================================================
    // تدريب نموذج مستقل لهذا الأصل
    // ========================================================

    const model =
        createModel();


    await trainModel(
        model,
        data.modelData
    );


    const input =
        tf.tensor2d([
            makeFeatures(
                values
            )
        ]);


    const output =
        model.predict(
            input
        );


    const probability =
        (
            await output.data()
        )[0];


    input.dispose();

    output.dispose();

    model.dispose();


    // ========================================================
    // القرار
    // ========================================================

    currentPrediction =
        probability >= 0.5
            ? "ناجح"
            : "خاسر";


    const confidence =
        (
            Math.max(
                probability,
                1 - probability
            ) * 100
        ).toFixed(2);


    document
        .getElementById(
            "prediction"
        )
        .textContent =
            `التوقع: ${currentPrediction}`;


    document
        .getElementById(
            "prediction"
        )
        .className =
            currentPrediction === "ناجح"
                ? "win"
                : "loss";


    document
        .getElementById(
            "confidence"
        )
        .textContent =
            `ثقة النموذج: ${confidence}%`;


    document
        .getElementById(
            "modelInfo"
        )
        .textContent =
            `النموذج تدرب على ${data.modelData.length} نتيجة سابقة لهذا الأصل فقط.`;

}


// ============================================================
// توقع مبدئي قبل توفر بيانات كافية
// ============================================================

function basicPrediction(
    values
) {

    const average =
        values.reduce(
            (a, b) =>
                a + b,
            0
        ) / 5;


    const trend =
        values[4] -
        values[0];


    let score = 0;


    if (
        average >= 50
    ) {

        score++;

    } else {

        score--;

    }


    if (
        values[4] >= 50
    ) {

        score++;

    } else {

        score--;

    }


    if (
        trend > 0
    ) {

        score++;

    } else {

        score--;

    }


    return score >= 0
        ? "ناجح"
        : "خاسر";

}


// ============================================================
// تسجيل النتيجة الحقيقية
//
// هذه أهم خطوة في التعلم.
// ============================================================

function recordResult(
    actual
) {

    const data =
        getData();


    // سجل للتاريخ
    data.history.push({

        percentages:
            [...currentPercentages],

        prediction:
            currentPrediction,

        actual:
            actual,

        time:
            new Date().toISOString()

    });


    // بيانات تدريب للنموذج
    data.modelData.push({

        percentages:
            [...currentPercentages],

        result:
            actual

    });


    saveDatabase();


    alert(
        "تم حفظ النتيجة. سيستخدمها النموذج في التدريب القادم."
    );


    showInput();

}


// ============================================================
// عرض السجل
// ============================================================

function showHistory() {

    const data =
        getData();


    hideAll();


    document
        .getElementById(
            "history"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "historyAsset"
        )
        .textContent =
            currentAsset;


    const list =
        document.getElementById(
            "historyList"
        );


    list.innerHTML = "";


    if (
        data.history.length === 0
    ) {

        list.innerHTML =
            "<p>لا توجد نتائج لهذا الأصل.</p>";

        return;

    }


    let correct = 0;


    data.history.forEach(
        item => {

            if (
                item.prediction ===
                item.actual
            ) {

                correct++;

            }

        }
    );


    const accuracy =
        (
            correct /
            data.history.length *
            100
        ).toFixed(2);


    const summary =
        document.createElement(
            "div"
        );


    summary.className =
        "history-item";


    summary.innerHTML = `

        <strong>
            إحصائيات ${currentAsset}
        </strong>

        <br>

        عدد النتائج:
        ${data.history.length}

        <br>

        الصحيحة:
        ${correct}

        <br>

        الخاطئة:
        ${data.history.length - correct}

        <br>

        الدقة:
        ${accuracy}%

    `;


    list.appendChild(
        summary
    );


    data.history
        .slice()
        .reverse()
        .forEach(
            (item, index) => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "history-item";


                div.innerHTML = `

                    <strong>
                        نتيجة ${data.history.length - index}
                    </strong>

                    <br>

                    النسب:
                    ${item.percentages.join(
                        " → "
                    )}%

                    <br>

                    التوقع:
                    ${item.prediction}

                    <br>

                    النتيجة:
                    ${item.actual}

                `;


                list.appendChild(
                    div
                );

            }
        );

}


// ============================================================
// البداية
// ============================================================

showHome();