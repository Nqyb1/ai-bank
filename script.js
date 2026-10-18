// ============================================================
// CENTRAL BANK AI — النسخة المطوّرة
// ملف: script.js
// يحافظ على قاعدة البيانات القديمة: centralBankAI
// التوقعات احتمالات تجريبية وليست ضمانًا للنتيجة.
// ============================================================

"use strict";

const TRADING = ["USDT", "SOL", "BNB", "XRP", "ADA", "USDC", "BTC", "ETH", "TRX"];
const INVESTMENT = ["Microsoft", "Apple", "Tesla", "Amazon", "Google", "Discord", "Facebook", "TikTok", "Starbucks"];

const MIN_ML_DATA = 100;
const MAX_HISTORY = 500;
const MAX_MODEL_DATA = 500;
const TRAIN_EPOCHS = 25;
const STORAGE_KEY = "centralBankAI";

let currentType = null;
let currentAsset = null;
let currentPrediction = null;
let currentProbability = null;
let currentPercentages = [];
let currentResults = [];
let currentPredictionId = null;
let predictionAlreadyRecorded = false;
let predictionDetails = null;

let database = loadDatabase();

function loadDatabase() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};

        const parsed = JSON.parse(raw);

        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : {};
    } catch (error) {
        console.error("تعذرت قراءة قاعدة البيانات:", error);
        alert("تعذرت قراءة بيانات Central Bank AI. لم يتم حذف البيانات الموجودة.");
        return {};
    }
}

function saveDatabase() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
        return true;
    } catch (error) {
        console.error("Database save error:", error);
        alert("تعذر حفظ البيانات. قد تكون مساحة تخزين المتصفح ممتلئة. صدّر نسخة احتياطية قبل المتابعة.");
        return false;
    }
}

function assetKey() {
    return `${currentType}::${currentAsset}`;
}

function getData() {
    if (!currentType || !currentAsset) {
        throw new Error("يجب اختيار النظام والأصل أولًا.");
    }

    const key = assetKey();

    if (!database[key] || typeof database[key] !== "object") {
        database[key] = { history: [], modelData: [] };
    }

    if (!Array.isArray(database[key].history)) {
        database[key].history = [];
    }

    if (!Array.isArray(database[key].modelData)) {
        database[key].modelData = [];
    }

    return database[key];
}

// تصدير نسخة احتياطية من بيانات المشروع.
function exportBackup() {
    const blob = new Blob(
        [JSON.stringify(database, null, 2)],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `centralBankAI-backup-${new Date().toISOString().slice(0, 10)}.json`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function hideAll() {
    document.querySelectorAll("section").forEach(section => {
        section.classList.add("hidden");
    });
}

function showHome() {
    hideAll();
    document.getElementById("home")?.classList.remove("hidden");
}

function showAssets() {
    hideAll();
    document.getElementById("assets")?.classList.remove("hidden");
}

function showInput() {
    hideAll();
    document.getElementById("input")?.classList.remove("hidden");
}

function chooseType(type) {
    if (type !== "trading" && type !== "investment") return;

    currentType = type;
    currentAsset = null;

    hideAll();
    document.getElementById("assets")?.classList.remove("hidden");

    const title = document.getElementById("assetTitle");

    if (title) {
        title.textContent = type === "trading"
            ? "💹 اختر أصل التداول"
            : "📈 اختر شركة الاستثمار";
    }

    createAssets(type === "trading" ? TRADING : INVESTMENT);
}

function createAssets(assets) {
    const container = document.getElementById("assetButtons");
    if (!container) return;

    container.replaceChildren();

    assets.forEach((asset, index) => {
        const button = document.createElement("button");

        button.className = "asset";
        button.textContent = `${index + 1} - ${asset}`;
        button.onclick = () => chooseAsset(asset);

        container.appendChild(button);
    });
}

function chooseAsset(asset) {
    currentAsset = asset;

    hideAll();
    document.getElementById("input")?.classList.remove("hidden");

    const heading = document.getElementById("selectedAsset");
    if (heading) heading.textContent = asset;

    clearInputs();
}

function clearInputs() {
    currentPercentages = [];
    currentResults = [];
    currentPrediction = null;
    currentProbability = null;
    currentPredictionId = null;
    predictionAlreadyRecorded = false;
    predictionDetails = null;

    for (let i = 1; i <= 5; i++) {
        const percentage = document.getElementById(`p${i}`);
        const result = document.getElementById(`r${i}`);

        if (percentage) percentage.value = "";
        if (result) result.value = "";
    }
}

function readInputData() {
    const percentages = [];
    const results = [];

    for (let i = 1; i <= 5; i++) {
        const percentageElement = document.getElementById(`p${i}`);
        const resultElement = document.getElementById(`r${i}`);

        if (!percentageElement || !resultElement) {
            alert(`حقول النسبة/النتيجة رقم ${i} غير موجودة في index.html.`);
            return null;
        }

        const rawValue = percentageElement.value.trim();

        if (rawValue === "") {
            alert(`أدخل النسبة رقم ${i}.`);
            percentageElement.focus();
            return null;
        }

        const value = Number(rawValue);

        if (!Number.isFinite(value) || value < 0 || value > 100) {
            alert(`النسبة رقم ${i} يجب أن تكون بين 0 و100.`);
            percentageElement.focus();
            return null;
        }

        const result = resultElement.value;

        if (result !== "ناجح" && result !== "خاسر") {
            alert(`اختر ناجح أو خاسر للنتيجة رقم ${i}.`);
            resultElement.focus();
            return null;
        }

        percentages.push(value);
        results.push(result);
    }

    return { percentages, results };
}

function resultToNumber(result) {
    return result === "ناجح" ? 1 : 0;
}

function calculateStats(percentages, results) {
    const average = percentages.reduce((a, b) => a + b, 0) /
        Math.max(percentages.length, 1);

    const changes = [];

    for (let i = 1; i < percentages.length; i++) {
        changes.push(percentages[i] - percentages[i - 1]);
    }

    const trend = changes.length
        ? changes.reduce((a, b) => a + b, 0) / changes.length
        : 0;

    const positiveChanges = changes.filter(x => x > 0).length;
    const negativeChanges = changes.filter(x => x < 0).length;
    const successful = results.filter(x => x === "ناجح").length;
    const failed = results.filter(x => x === "خاسر").length;
    const successRate = successful / Math.max(results.length, 1);

    return {
        average,
        trend,
        positiveChanges,
        negativeChanges,
        successful,
        failed,
        successRate
    };
}

// 15 ميزات ثابتة؛ لا تغيّر ترتيبها دون ترحيل البيانات.
function makeFeatures(percentages, results) {
    const stats = calculateStats(percentages, results);

    return [
        ...percentages.map(value => value / 100),
        ...results.map(resultToNumber),
        stats.average / 100,
        Math.max(-1, Math.min(1, stats.trend / 100)),
        stats.positiveChanges / 4,
        stats.negativeChanges / 4,
        stats.successRate
    ];
}

function createModel() {
    const model = tf.sequential();

    model.add(tf.layers.dense({
        inputShape: [15],
        units: 8,
        activation: "relu",
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    model.add(tf.layers.dropout({ rate: 0.20 }));

    model.add(tf.layers.dense({
        units: 4,
        activation: "relu",
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    model.add(tf.layers.dense({
        units: 1,
        activation: "sigmoid"
    }));

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: "binaryCrossentropy",
        metrics: ["accuracy"]
    });

    return model;
}

function getValidModelData(modelData) {
    if (!Array.isArray(modelData)) return [];

    return modelData.filter(item =>
        item &&
        Array.isArray(item.percentages) &&
        item.percentages.length === 5 &&
        item.percentages.every(x =>
            Number.isFinite(Number(x)) &&
            Number(x) >= 0 &&
            Number(x) <= 100
        ) &&
        Array.isArray(item.results) &&
        item.results.length === 5 &&
        item.results.every(x => x === "ناجح" || x === "خاسر") &&
        (item.result === "ناجح" || item.result === "خاسر")
    ).slice().sort((a, b) =>
        String(a.time || "").localeCompare(String(b.time || ""))
    );
}

async function trainModel(model, modelData) {
    const validData = getValidModelData(modelData);

    if (validData.length < MIN_ML_DATA) return null;

    const xs = validData.map(item =>
        makeFeatures(item.percentages, item.results)
    );

    const ys = validData.map(item =>
        item.result === "ناجح" ? 1 : 0
    );

    const xTensor = tf.tensor2d(xs);
    const yTensor = tf.tensor2d(ys.map(x => [x]));

    try {
        return await model.fit(xTensor, yTensor, {
            epochs: TRAIN_EPOCHS,
            batchSize: Math.min(16, validData.length),
            shuffle: true,
            verbose: 0
        });
    } finally {
        xTensor.dispose();
        yTensor.dispose();
    }
}

function patternPrediction(currentPercentages, currentResults, modelData) {
    const validData = getValidModelData(modelData);

    if (!validData.length) return 0.5;

    const currentFeatures = makeFeatures(
        currentPercentages,
        currentResults
    );

    const scores = validData.map(item => {
        const features = makeFeatures(
            item.percentages,
            item.results
        );

        let distanceSquared = 0;

        for (let i = 0; i < features.length; i++) {
            distanceSquared +=
                (currentFeatures[i] - features[i]) ** 2;
        }

        const distance = Math.sqrt(distanceSquared);

        return {
            similarity: 1 / (1 + distance * 8),
            result: item.result === "ناجح" ? 1 : 0
        };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.min(15, validData.length));

    const totalWeight = scores.reduce(
        (sum, item) => sum + item.similarity,
        0
    );

    if (!totalWeight) return 0.5;

    return scores.reduce(
        (sum, item) => sum + item.result * item.similarity,
        0
    ) / totalWeight;
}

async function mlPrediction(percentages, results, validData) {
    if (
        validData.length < MIN_ML_DATA ||
        typeof tf === "undefined"
    ) {
        return null;
    }

    const model = createModel();

    let input = null;
    let output = null;

    try {
        await trainModel(model, validData);

        input = tf.tensor2d([
            makeFeatures(percentages, results)
        ]);

        output = model.predict(input);

        const values = await output.data();

        return Math.max(0, Math.min(1, values[0]));
    } catch (error) {
        console.error("ML prediction error:", error);
        return null;
    } finally {
        if (input) input.dispose();
        if (output) output.dispose();
        model.dispose();
    }
}

// اختبار زمني: كل سجل يُقيّم باستخدام السجلات الأقدم منه فقط.
function walkForwardEvaluation(modelData) {
    const validData = getValidModelData(modelData);
    const minimumPrior = 12;

    let patternCorrect = 0;
    let baselineCorrect = 0;
    let patternBrier = 0;
    let baselineBrier = 0;
    let evaluated = 0;

    for (let i = minimumPrior; i < validData.length; i++) {
        const prior = validData.slice(0, i);
        const item = validData[i];
        const actual = item.result === "ناجح" ? 1 : 0;

        const pPattern = patternPrediction(
            item.percentages,
            item.results,
            prior
        );

        const priorSuccesses = prior.filter(
            x => x.result === "ناجح"
        ).length;

        const pBaseline =
            (priorSuccesses + 1) / (prior.length + 2);

        if ((pPattern >= 0.5 ? 1 : 0) === actual) {
            patternCorrect++;
        }

        if ((pBaseline >= 0.5 ? 1 : 0) === actual) {
            baselineCorrect++;
        }

        patternBrier += (pPattern - actual) ** 2;
        baselineBrier += (pBaseline - actual) ** 2;
        evaluated++;
    }

    if (!evaluated) {
        return {
            evaluated: 0,
            patternAccuracy: null,
            baselineAccuracy: null,
            patternBrier: null,
            baselineBrier: null
        };
    }

    return {
        evaluated,
        patternAccuracy: patternCorrect / evaluated,
        baselineAccuracy: baselineCorrect / evaluated,
        patternBrier: patternBrier / evaluated,
        baselineBrier: baselineBrier / evaluated
    };
}

function statisticalPrediction(percentages, results, modelData = []) {
    const recentSuccesses = results.filter(
        x => x === "ناجح"
    ).length;

    const recentRate =
        (recentSuccesses + 1) / (results.length + 2);

    const validData = getValidModelData(modelData);

    if (!validData.length) return recentRate;

    const historicalSuccesses = validData.filter(
        x => x.result === "ناجح"
    ).length;

    const historicalRate =
        (historicalSuccesses + 1) / (validData.length + 2);

    const historicalWeight = Math.min(
        0.65,
        validData.length / (validData.length + 20)
    );

    return recentRate * (1 - historicalWeight) +
        historicalRate * historicalWeight;
}

async function generatePrediction(percentages, results, data) {
    const validData = getValidModelData(data.modelData);

    const statistical = statisticalPrediction(
        percentages,
        results,
        validData
    );

    const pattern = patternPrediction(
        percentages,
        results,
        validData
    );

    const evaluation = walkForwardEvaluation(validData);
    let mlProbability = null;

    // شبكة أصغر ولا تعمل إلا بعد توفر بيانات أكثر.
    if (
        validData.length >= MIN_ML_DATA &&
        typeof tf !== "undefined"
    ) {
        mlProbability = await mlPrediction(
            percentages,
            results,
            validData
        );
    }

    let probability;
    let method;

    if (mlProbability !== null) {
        probability =
            mlProbability * 0.20 +
            pattern * 0.35 +
            statistical * 0.45;

        method = "تعلم آلي محدود الوزن + تشابه الأنماط + خط أساس";
    } else if (validData.length > 0) {
        probability = pattern * 0.35 + statistical * 0.65;
        method = "تشابه الأنماط + خط أساس إحصائي";
    } else {
        probability = statistical;
        method = "خط أساس من آخر خمس نتائج";
    }

    return {
        probability: Math.max(0.05, Math.min(0.95, probability)),
        mlProbability,
        patternProbability: pattern,
        statisticalProbability: statistical,
        dataCount: validData.length,
        method,
        evaluation
    };
}

async function predict() {
    const inputData = readInputData();
    if (!inputData) return;

    currentPercentages = [...inputData.percentages];
    currentResults = [...inputData.results];
    currentPrediction = null;
    currentProbability = null;
    currentPredictionId = null;
    predictionAlreadyRecorded = false;
    predictionDetails = null;

    let data;

    try {
        data = getData();
    } catch (error) {
        alert(error.message);
        return;
    }

    hideAll();

    document.getElementById("result")?.classList.remove("hidden");
    document.getElementById("prediction").textContent = "جاري التحليل...";
    document.getElementById("confidence").textContent = "";
    document.getElementById("modelInfo").textContent = "";

    try {
        const result = await generatePrediction(
            inputData.percentages,
            inputData.results,
            data
        );

        currentProbability = result.probability;
        currentPrediction =
            result.probability >= 0.5 ? "ناجح" : "خاسر";

        predictionDetails = result;

        const predictionEl = document.getElementById("prediction");

        predictionEl.textContent =
            `التوقع التجريبي: ${currentPrediction}`;

        predictionEl.className =
            currentPrediction === "ناجح" ? "win" : "loss";

        document.getElementById("confidence").textContent =
            `ترجيح النموذج للنجاح: ${(result.probability * 100).toFixed(1)}% — تقدير تجريبي، وليس نسبة دقة مضمونة.`;

        const evaluation = result.evaluation;

        const evalText =
            evaluation && evaluation.evaluated >= 20
                ? ` | اختبار زمني: ${evaluation.evaluated} عينة | الأنماط ${(evaluation.patternAccuracy * 100).toFixed(1)}% | خط الأساس ${(evaluation.baselineAccuracy * 100).toFixed(1)}%`
                : " | لا توجد عينات كافية لاختبار زمني موثوق";

        const mlText = typeof tf === "undefined"
            ? " | TensorFlow غير متاح؛ استُخدم البديل الإحصائي"
            : "";

        document.getElementById("modelInfo").textContent =
            `${result.method} | عينات التعلم: ${result.dataCount} | حد التعلم الآلي: ${MIN_ML_DATA}${evalText}${mlText}`;
    } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء التوقع. افتح وحدة التحكم لمعرفة التفاصيل.");
        showInput();
    }
}

function recordResult(actual) {
    if (
        !currentAsset ||
        currentPercentages.length !== 5 ||
        currentResults.length !== 5 ||
        !currentPrediction
    ) {
        alert("نفّذ توقعًا أولًا قبل تسجيل النتيجة.");
        return;
    }

    if (predictionAlreadyRecorded) {
        alert("تم تسجيل نتيجة هذا التوقع بالفعل. نفّذ توقعًا جديدًا للجولة التالية.");
        return;
    }

    if (actual !== "ناجح" && actual !== "خاسر") return;

    const data = getData();
    const now = new Date().toISOString();

    const id =
        `prediction_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const historyItem = {
        id,
        percentages: [...currentPercentages],
        results: [...currentResults],
        prediction: currentPrediction,
        probability: currentProbability,
        actual,
        time: now,
        method: predictionDetails?.method || "غير معروف",
        dataCountAtPrediction: predictionDetails?.dataCount ?? 0
    };

    const modelItem = {
        id,
        percentages: [...currentPercentages],
        results: [...currentResults],
        result: actual,
        time: now
    };

    data.history.push(historyItem);
    data.modelData.push(modelItem);

    data.history = data.history.slice(-MAX_HISTORY);
    data.modelData = data.modelData.slice(-MAX_MODEL_DATA);

    if (!saveDatabase()) {
        data.history = data.history.filter(item => item.id !== id);
        data.modelData = data.modelData.filter(item => item.id !== id);
        return;
    }

    predictionAlreadyRecorded = true;

    alert("تم حفظ النتيجة مرة واحدة وإضافتها إلى سجل التعلم.");
    showInput();
}

function deletePrediction(id) {
    if (!currentAsset) return;

    const data = getData();

    const exists =
        data.history.some(item => item.id === id) ||
        data.modelData.some(item => item.id === id);

    if (!exists) {
        alert("لم يتم العثور على التوقع.");
        return;
    }

    if (!confirm("هل تريد حذف هذا التوقع من السجل وبيانات التعلم؟")) {
        return;
    }

    data.history = data.history.filter(item => item.id !== id);
    data.modelData = data.modelData.filter(item => item.id !== id);

    saveDatabase();

    alert("تم حذف السجل المحدد فقط.");
    showHistory();
}

function editPredictionResult(id) {
    if (!currentAsset) return;

    const data = getData();

    const historyItem = data.history.find(item => item.id === id);
    const modelItem = data.modelData.find(item => item.id === id);

    if (!historyItem && !modelItem) {
        alert("التوقع غير موجود.");
        return;
    }

    const currentActual =
        historyItem?.actual || modelItem?.result || "";

    const newResult = prompt(
        "اكتب النتيجة الصحيحة كما هي:\nناجح أو خاسر",
        currentActual
    );

    if (newResult === null) return;

    const cleaned = newResult.trim();

    if (cleaned !== "ناجح" && cleaned !== "خاسر") {
        alert("اكتب ناجح أو خاسر فقط.");
        return;
    }

    if (historyItem) historyItem.actual = cleaned;
    if (modelItem) modelItem.result = cleaned;

    saveDatabase();

    alert("تم تصحيح النتيجة.");
    showHistory();
}

function calculateAccuracy(history) {
    const evaluated = (history || []).filter(item =>
        (item.prediction === "ناجح" || item.prediction === "خاسر") &&
        (item.actual === "ناجح" || item.actual === "خاسر")
    );

    if (!evaluated.length) return null;

    const correct = evaluated.filter(
        item => item.prediction === item.actual
    ).length;

    return {
        correct,
        total: evaluated.length,
        accuracy: correct / evaluated.length * 100
    };
}

function showHistory() {
    if (!currentAsset) {
        alert("اختر أصلًا أولًا.");
        return;
    }

    const data = getData();

    hideAll();

    document.getElementById("history")?.classList.remove("hidden");
    document.getElementById("historyAsset").textContent = currentAsset;

    const list = document.getElementById("historyList");
    list.replaceChildren();

    if (!data.history.length) {
        const empty = document.createElement("p");
        empty.textContent = "لا توجد نتائج لهذا الأصل.";
        list.appendChild(empty);
        return;
    }

    const validData = getValidModelData(data.modelData);
    const stats = calculateAccuracy(data.history);

    const summary = document.createElement("div");
    summary.className = "history-item";

    summary.textContent =
        `إحصائيات ${currentAsset} — عدد السجلات: ${data.history.length} — الصحيحة: ${stats ? stats.correct : 0} — الخاطئة: ${stats ? stats.total - stats.correct : 0} — دقة السجلات السابقة الوصفية: ${stats ? stats.accuracy.toFixed(2) + "%" : "غير متاحة"} — عينات التعلم الصالحة: ${validData.length}. هذه الدقة على سجلات سبق تسجيلها وليست ضمانًا للنتائج القادمة.`;

    list.appendChild(summary);

    data.history.slice().reverse().forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "history-item";

        const title = document.createElement("strong");
        title.textContent = `نتيجة ${data.history.length - index}`;
        div.appendChild(title);

        const lines = [
            `النسب والحالات: ${(item.percentages || []).map((percentage, i) => `${percentage}% (${item.results?.[i] || "غير معروف"})`).join(" → ")}`,
            `التوقع: ${item.prediction || "غير معروف"}`,
            `احتمال النجاح التقديري: ${typeof item.probability === "number" ? (item.probability * 100).toFixed(1) + "%" : "غير متوفر"}`,
            `النتيجة الحقيقية: ${item.actual || "غير مسجلة"}`,
            `التقييم: ${item.prediction && item.actual ? (item.prediction === item.actual ? "صحيح" : "خطأ") : "غير مكتمل"}`,
            `طريقة التوقع: ${item.method || "غير مسجلة"}`,
            `الوقت: ${item.time || "غير معروف"}`
        ];

        lines.forEach(line => {
            const p = document.createElement("p");
            p.textContent = line;
            div.appendChild(p);
        });

        const editButton = document.createElement("button");
        editButton.textContent = "✏️ تصحيح النتيجة";
        editButton.onclick = () => editPredictionResult(item.id);
        div.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "🗑️ حذف التوقع";
        deleteButton.onclick = () => deletePrediction(item.id);
        div.appendChild(deleteButton);

        list.appendChild(div);
    });
}

// ترقية السجلات القديمة دون حذفها أو تغيير مفتاح التخزين.
function migrateOldData() {
    let changed = false;

    for (const key of Object.keys(database)) {
        const data = database[key];

        if (!data || typeof data !== "object") continue;

        if (!Array.isArray(data.history)) {
            data.history = [];
            changed = true;
        }

        if (!Array.isArray(data.modelData)) {
            data.modelData = [];
            changed = true;
        }

        data.history.forEach(item => {
            if (item && !item.id) {
                item.id =
                    `old_${item.time || Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                changed = true;
            }
        });

        data.modelData.forEach(item => {
            if (item && !item.id) {
                const matching = data.history.find(
                    h => h && h.time && h.time === item.time && h.id
                );

                item.id = matching
                    ? matching.id
                    : `old_model_${item.time || Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

                changed = true;
            }
        });
    }

    if (changed) saveDatabase();
}

function addBackupButtonIfPossible() {
    const container = document.querySelector(".app");

    if (!container || document.getElementById("backupDataButton")) {
        return;
    }

    const button = document.createElement("button");

    button.id = "backupDataButton";
    button.className = "secondary";
    button.textContent = "⬇️ تصدير نسخة احتياطية من البيانات";
    button.onclick = exportBackup;

    container.appendChild(button);
}

migrateOldData();
addBackupButtonIfPossible();
showHome();
