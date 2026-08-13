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
// الحالة الحالية
// ============================================================

let currentType = null;

let currentAsset = null;

let currentPrediction = null;

let currentProbability = null;

let currentPercentages = [];

let currentResults = [];


// ============================================================
// قاعدة البيانات
//
// كل أصل له بيانات مستقلة.
// مثال:
//
// trading::BTC
// trading::ETH
// investment::Microsoft
//
// لا يتم خلط بيانات أصل مع أصل آخر.
// ============================================================

let database =
    JSON.parse(
        localStorage.getItem(
            "centralBankAI"
        )
    ) || {};


// ============================================================
// حفظ قاعدة البيانات
// ============================================================

function saveDatabase() {

    localStorage.setItem(
        "centralBankAI",
        JSON.stringify(database)
    );

}


// ============================================================
// مفتاح الأصل
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

    currentAsset = null;

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
// إنشاء قائمة الأصول
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

    currentPercentages = [];

    currentResults = [];

    currentPrediction = null;

    currentProbability = null;

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        const percentageInput =
            document.getElementById(
                "p" + i
            );

        if (
            percentageInput
        ) {

            percentageInput.value = "";

        }


        const resultInput =
            document.getElementById(
                "r" + i
            );

        if (
            resultInput
        ) {

            resultInput.value = "";

        }

    }

}


// ============================================================
// قراءة النسب + ناجح/خاسر
//
// النتيجة تكون بهذا الشكل:
//
// 33% + خاسر
// 46% + ناجح
//
// من الأقدم إلى الأحدث.
// ============================================================

function readInputData() {

    const percentages = [];

    const results = [];

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        const percentageElement =
            document.getElementById(
                "p" + i
            );

        const resultElement =
            document.getElementById(
                "r" + i
            );


        if (
            !percentageElement
        ) {

            alert(
                `حقل النسبة رقم ${i} غير موجود.`
            );

            return null;

        }


        const value =
            Number(
                percentageElement.value
            );


        if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > 100
        ) {

            alert(
                `النسبة رقم ${i} يجب أن تكون بين 0 و100.`
            );

            return null;

        }


        if (
            !resultElement
        ) {

            alert(
                `حقل نتيجة النسبة رقم ${i} غير موجود.`
            );

            return null;

        }


        const result =
            resultElement.value;


        if (
            result !== "ناجح" &&
            result !== "خاسر"
        ) {

            alert(
                `اختر ناجح أو خاسر للنسبة رقم ${i}.`
            );

            return null;

        }


        percentages.push(
            value
        );

        results.push(
            result
        );

    }


    return {

        percentages:
            percentages,

        results:
            results

    };

}


// ============================================================
// تحويل ناجح/خاسر إلى رقم
//
// ناجح = 1
// خاسر = 0
// ============================================================

function resultToNumber(
    result
) {

    return result === "ناجح"
        ? 1
        : 0;

}


// ============================================================
// إنشاء Features للنموذج
//
// النموذج يستخدم:
//
// - آخر 5 نسب
// - حالة كل نسبة
// - المتوسط
// - الفروقات
// - الاتجاه العام
//
// المجموع = 16 Feature
// ============================================================

function makeFeatures(
    percentages,
    results
) {

    const average =
        percentages.reduce(
            (a, b) =>
                a + b,
            0
        ) / 5;


    const d1 =
        percentages[1] -
        percentages[0];

    const d2 =
        percentages[2] -
        percentages[1];

    const d3 =
        percentages[3] -
        percentages[2];

    const d4 =
        percentages[4] -
        percentages[3];


    const trend =
        (
            d1 +
            d2 +
            d3 +
            d4
        ) / 4;


    const resultFeatures =
        results.map(
            result =>
                resultToNumber(
                    result
                )
        );


    return [

        // النسب
        percentages[0] / 100,
        percentages[1] / 100,
        percentages[2] / 100,
        percentages[3] / 100,
        percentages[4] / 100,

        // نتائج النسب السابقة
        resultFeatures[0],
        resultFeatures[1],
        resultFeatures[2],
        resultFeatures[3],
        resultFeatures[4],

        // المتوسط
        average / 100,

        // الفروقات
        d1 / 100,
        d2 / 100,
        d3 / 100,
        d4 / 100,

        // الاتجاه
        trend / 100

    ];

}


// ============================================================
// إنشاء نموذج Machine Learning
// ============================================================

function createModel() {

    const model =
        tf.sequential();


    model.add(
        tf.layers.dense({

            inputShape: [16],

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
                0.005
            ),

        loss:
            "binaryCrossentropy",

        metrics:
            ["accuracy"]

    });


    return model;

}


// ============================================================
// التحقق من بيانات التدريب القديمة
//
// أي بيانات قديمة لا تحتوي على results
// لن يتم استخدامها مع النموذج الجديد.
// ============================================================

function getValidModelData(
    modelData
) {

    return modelData.filter(
        item =>

            Array.isArray(
                item.percentages
            ) &&

            item.percentages.length === 5 &&

            Array.isArray(
                item.results
            ) &&

            item.results.length === 5 &&

            (
                item.result === "ناجح" ||
                item.result === "خاسر"
            )
    );

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

    const validData =
        getValidModelData(
            modelData
        );


    if (
        validData.length < 10
    ) {

        return null;

    }


    const xs =
        validData.map(
            item =>
                makeFeatures(
                    item.percentages,
                    item.results
                )
        );


    const ys =
        validData.map(
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

                epochs: 80,

                batchSize:
                    Math.min(
                        16,
                        validData.length
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
// التوقع
// ============================================================

async function predict() {

    const inputData =
        readInputData();


    if (
        !inputData
    ) {

        return;

    }


    currentPercentages =
        [
            ...inputData.percentages
        ];


    currentResults =
        [
            ...inputData.results
        ];


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
    // البيانات المتوفرة
    // ========================================================

    const validData =
        getValidModelData(
            data.modelData
        );


    // ========================================================
    // قبل توفر 10 نتائج تدريبية
    // ========================================================

    if (
        validData.length < 10
    ) {

        currentPrediction =
            basicPrediction(
                inputData.percentages,
                inputData.results
            );


        currentProbability =
            currentPrediction === "ناجح"
                ? 0.5
                : 0.5;


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
                "النموذج يحتاج إلى 10 نتائج سابقة على الأقل قبل بدء التعلم الآلي.";


        document
            .getElementById(
                "modelInfo"
            )
            .textContent =
                `البيانات التدريبية المتاحة لهذا الأصل: ${validData.length}`;


        return;

    }


    // ========================================================
    // إنشاء نموذج مستقل لهذا الأصل
    // ========================================================

    const model =
        createModel();


    await trainModel(
        model,
        validData
    );


    // ========================================================
    // بيانات التوقع الحالية
    // ========================================================

    const features =
        makeFeatures(
            inputData.percentages,
            inputData.results
        );


    const input =
        tf.tensor2d([
            features
        ]);


    const output =
        model.predict(
            input
        );


    const probability =
        (
            await output.data()
        )[0];


    currentProbability =
        probability;


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
            `النموذج تدرب على ${validData.length} نتيجة سابقة لهذا الأصل فقط.`;

}


// ============================================================
// توقع مبدئي
//
// يستخدم النسب + نتائجها السابقة.
// هذا ليس Machine Learning.
// يستخدم فقط حتى تتجمع 10 نتائج تدريبية.
// ============================================================

function basicPrediction(
    values,
    results
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


    const successfulResults =
        results.filter(
            result =>
                result === "ناجح"
        ).length;


    const failedResults =
        results.filter(
            result =>
                result === "خاسر"
        ).length;


    let score = 0;


    // متوسط النسب
    if (
        average >= 50
    ) {

        score++;

    } else {

        score--;

    }


    // اتجاه النسب
    if (
        trend > 0
    ) {

        score++;

    } else if (
        trend < 0
    ) {

        score--;

    }


    // آخر نتيجة
    if (
        results[4] === "ناجح"
    ) {

        score++;

    } else {

        score--;

    }


    // عدد النتائج الناجحة مقابل الخاسرة
    if (
        successfulResults >
        failedResults
    ) {

        score++;

    } else if (
        failedResults >
        successfulResults
    ) {

        score--;

    }


    return score >= 0
        ? "ناجح"
        : "خاسر";

}


// ============================================================
// تسجيل النتيجة الحقيقية للتوقع
//
// هذه هي النتيجة الخاصة بالتوقع الجديد.
// مثال:
//
// التوقع = ناجح
// النتيجة الحقيقية = خاسر
//
// يتم حفظها للتعلم.
// ============================================================

function recordResult(
    actual
) {

    if (
        !currentAsset ||
        currentPercentages.length !== 5 ||
        currentResults.length !== 5
    ) {

        alert(
            "لا توجد بيانات توقع صالحة للحفظ."
        );

        return;

    }


    if (
        actual !== "ناجح" &&
        actual !== "خاسر"
    ) {

        return;

    }


    const data =
        getData();


    // ========================================================
    // سجل التاريخ
    // ========================================================

    data.history.push({

        percentages:
            [
                ...currentPercentages
            ],

        results:
            [
                ...currentResults
            ],

        prediction:
            currentPrediction,

        probability:
            currentProbability,

        actual:
            actual,

        time:
            new Date().toISOString()

    });


    // ========================================================
    // بيانات التدريب
    // ========================================================

    data.modelData.push({

        percentages:
            [
                ...currentPercentages
            ],

        results:
            [
                ...currentResults
            ],

        result:
            actual,

        time:
            new Date().toISOString()

    });


    saveDatabase();


    alert(
        "تم حفظ النتيجة. سيستخدمها النموذج في التدريب القادم."
    );


    showInput();

}


// ============================================================
// حساب دقة النموذج
// ============================================================

function calculateAccuracy(
    history
) {

    if (
        !history ||
        history.length === 0
    ) {

        return 0;

    }


    let correct = 0;


    history.forEach(
        item => {

            if (
                item.prediction ===
                item.actual
            ) {

                correct++;

            }

        }
    );


    return (
        correct /
        history.length *
        100
    );

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


    // ========================================================
    // الإحصائيات
    // ========================================================

    const accuracy =
        calculateAccuracy(
            data.history
        );


    const correct =
        data.history.filter(
            item =>
                item.prediction ===
                item.actual
        ).length;


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

        عدد التوقعات:
        ${data.history.length}

        <br>

        الصحيحة:
        ${correct}

        <br>

        الخاطئة:
        ${data.history.length - correct}

        <br>

        دقة النموذج:
        ${accuracy.toFixed(2)}%

        <br>

        البيانات التدريبية:
        ${getValidModelData(data.modelData).length}

    `;


    list.appendChild(
        summary
    );


    // ========================================================
    // النتائج السابقة
    // ========================================================

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


                const percentagesText =
                    item.percentages
                        .map(
                            (percentage, i) =>
                                `${percentage}% (${item.results && item.results[i] ? item.results[i] : "غير معروف"})`
                        )
                        .join(
                            " → "
                        );


                const isCorrect =
                    item.prediction ===
                    item.actual;


                div.innerHTML = `

                    <strong>
                        نتيجة ${data.history.length - index}
                    </strong>

                    <br>

                    النسب والحالات:
                    ${percentagesText}

                    <br>

                    التوقع:
                    ${item.prediction}

                    <br>

                    النتيجة الحقيقية:
                    ${item.actual}

                    <br>

                    حالة التوقع:
                    ${isCorrect
                        ? "✅ صحيح"
                        : "❌ خطأ"
                    }

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
