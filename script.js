function convertToLunar() {
    const solarDateInput = document.getElementById('solarDate').value;
    if (!solarDateInput) {
        document.getElementById('result').innerText = "Vui lòng nhập ngày hợp lệ.";
        return;
    }

    const solarDate = new Date(solarDateInput);
    if (isNaN(solarDate.getTime())) {
        document.getElementById('result').innerText = "Ngày không hợp lệ. Vui lòng thử lại.";
        return;
    }

    const lunarDate = convertSolarToLunar(solarDate.getDate(), solarDate.getMonth() + 1, solarDate.getFullYear(), 7);
    if (!lunarDate) {
        document.getElementById('result').innerText = "Không thể tính toán ngày âm lịch cho ngày đã nhập.";
        return;
    }

    document.getElementById('result').innerText = `Năm Âm lịch: ${lunarDate[2]}`; //${lunarDate[0]}/${lunarDate[1]}/${lunarDate[2]}
}

function convertSolarToLunar(dd, mm, yy, timeZone) {
    const dayNumber = jdFromDate(dd, mm, yy);
    const k = Math.floor((dayNumber - 2415021) / 29.53058867);
    let monthStart = getNewMoonDay(k + 1, timeZone);

    if (monthStart > dayNumber) {
        monthStart = getNewMoonDay(k, timeZone);
    }

    const a11 = getLunarMonth11(yy, timeZone);
    let b11 = a11;

    if (a11 >= monthStart) {
        b11 = getLunarMonth11(yy - 1, timeZone);
    }

    let lunarYear = a11 >= monthStart ? yy : yy - 1;
    const lunarDay = dayNumber - monthStart + 1;

    if (lunarDay <= 0 || lunarDay > 30) {
        return null;
    }

    let diff = Math.floor((dayNumber - b11) / 30);
    let lunarMonth = diff -2 ;

    if (lunarMonth > 12) {
        lunarMonth -= 12;
    }

    if (lunarMonth <= 0) {
        lunarMonth += 12;
    }

    if (lunarMonth >= 11 && diff < 4) {
        lunarYear--;
    }

    return [lunarDay, lunarMonth, lunarYear];
}

// Hàm hỗ trợ
function jdFromDate(dd, mm, yy) {
    let a = Math.floor((14 - mm) / 12);
    let y = yy + 4800 - a;
    let m = mm + 12 * a - 3;
    let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    if (jd < 2299161) {
        jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    }
    return jd;
}

function getNewMoonDay(k, timeZone) {
    const T = k / 1236.85;
    const T2 = T * T;
    const dr = Math.PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T * T * T;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T * T * T;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T * T * T;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T * T * T;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 += 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    const deltat = 0.5 + (timeZone === 7 ? -0.5 : 0);
    const JdNew = Jd1 + C1 - deltat;
    return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn, timeZone) {
    const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
    const dr = Math.PI / 180;
    const M = 357.52910 + 35999.05030 * T;
    let DL = (1.914600 - 0.004817 * T) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(2 * dr * M);
    DL += 0.000290 * Math.sin(3 * dr * M);
    const L0 = 280.46645 + 36000.76983 * T;
    const L = L0 + DL;
    const omega = 125.04 - 1934.136 * T;
    const lambda = L - 0.00569 - 0.00478 * Math.sin(omega * dr);
    return lambda - 360 * Math.floor(lambda / 360);
}

function getLunarMonth11(yy, timeZone) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    const k = Math.floor(off / 29.53058867);
    let nm = getNewMoonDay(k, timeZone);
    const sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) {
        nm = getNewMoonDay(k - 1, timeZone);
    }
    return nm;
}

function getLeapMonthOffset(a11, timeZone) {
    const k = Math.floor((a11 - 2415021) / 29.53058867);
    let last = 0;
    let arc = getSunLongitude(getNewMoonDay(k + 1, timeZone), timeZone);
    for (let i = 1; i < 14; i++) {
        const arcNext = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
        if (arcNext === last) {
            break;
        }
        last = arcNext;
    }
    return i - 1;
}
