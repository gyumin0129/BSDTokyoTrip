/** [PART 1] 데이터 및 초기 설정 **/
let baseRate = 9.00, currentRate = 9.20, rateType = 'cash', spreadPercent = 90, people = 1, currentDay = 1;

const schedules = {
    1: {
        title: "1일차: 침략 개시",
        date: "2.7 (토)",
        items: [
            { time: "10:25", place: "나리타 공항 도착", desc: "스카이라이너 타고 우에노 이동", lat: 35.772, lng: 140.392 },
            { time: "13:00", place: "숙소 (다이토구)", desc: "체크인 또는 짐 보관", lat: 35.705184, lng: 139.779651 },
            { time: "15:00", place: "센소지", desc: "나카미세도리 구경 및 참배", lat: 35.7147, lng: 139.7966 },
            { time: "18:00", place: "스카이트리", desc: "도쿄 야경 감상", lat: 35.7101, lng: 139.8107 }
        ]
    },
    2: {
        title: "2일차: 도심 정찰",
        date: "2.8 (일)",
        items: [
            { time: "11:00", place: "오다이바", desc: "자유의 여신상 & 건담", lat: 35.6244, lng: 139.7755 },
            { time: "16:00", place: "시부야", desc: "스크램블 교차로 & 시부야 스카이", lat: 35.6580, lng: 139.7016 }
        ]
    },
    3: {
        title: "3일차: 덕력 보급",
        date: "2.9 (월)",
        items: [
            { time: "10:00", place: "아키하바라", desc: "애니메이션/피규어 쇼핑 (도보 이동 가능)", lat: 35.6983, lng: 139.7731 }
        ]
    },
    4: {
        title: "4일차: 마법과 환상",
        date: "2.10 (화)",
        items: [
            { time: "10:00", place: "해리포터 스튜디오", desc: "워너브라더스 투어", lat: 35.7445, lng: 139.6152 },
            { time: "17:00", place: "포켓몬 센터", desc: "이케부쿠로 메가도쿄점", lat: 35.7289, lng: 139.7199 }
        ]
    },
    5: {
        title: "5일차: 전열 정비",
        date: "2.11 (수)",
        items: [
            { time: "자유", place: "개인 일정 및 휴식", desc: "일본 공휴일(건국기념일) 주의", lat: 35.7051, lng: 139.7796 }
        ]
    },
    6: {
        title: "6일차: 꿈의 나라",
        date: "2.12 (목)",
        items: [
            { time: "08:30", place: "디즈니랜드", desc: "오픈런 대작전", lat: 35.6329, lng: 139.8804 }
        ]
    },
    7: {
        title: "7일차: 철수 작전",
        date: "2.13 (금)",
        items: [
            { time: "10:00", place: "우에노역", desc: "마지막 기념품 쇼핑", lat: 35.7137, lng: 139.7772 },
            { time: "11:30", place: "나리타 공항 이동", desc: "14:05 비행기 체크인", lat: 35.772, lng: 140.392 }
        ]
    }
};

/** [PART 2] 데이터 로드 **/
async function fetchAllData() {
    try {
        const r = await fetch('https://api.frankfurter.app/latest?from=JPY&to=KRW');
        const d = await r.json();
        baseRate = d.rates.KRW;
        
        calculateFinalRate(); // 환율 계산기 업데이트
        
        // [여기서 호출!] 실제 등락폭 계산 함수 실행
        updateRateTrend(baseRate); 
    } catch (e) {
        console.log("환율 데이터 로드 실패");
    }

    try {
        const w = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current=temperature_2m,apparent_temperature,weather_code&hourly=precipitation_probability&timezone=Asia%2FTokyo&forecast_days=1");
        const wd = await w.json();
        document.getElementById('weather-loading').classList.add('hidden');
        document.getElementById('weather-info').classList.remove('hidden');
        const code = wd.current.weather_code;
        const iconEl = document.getElementById('weather-icon');
        iconEl.className = "ph-fill";
        if (code === 0) { iconEl.classList.add("ph-sun"); iconEl.style.color = "#FFAB00"; }
        else if (code >= 1 && code <= 3) { iconEl.classList.add("ph-cloud-sun"); iconEl.style.color = "#FFD600"; }
        else if (code >= 45 && code <= 48) { iconEl.classList.add("ph-cloud"); iconEl.style.color = "#8B95A1"; }
        else if (code >= 51 && code <= 67) { iconEl.classList.add("ph-cloud-rain"); iconEl.style.color = "#3182F6"; }
        else if (code >= 71 && code <= 77) { iconEl.classList.add("ph-snowflake"); iconEl.style.color = "#79C2FE"; }
        else if (code >= 80 && code <= 99) { iconEl.classList.add("ph-cloud-lightning"); iconEl.style.color = "#6B3AFE"; }
        else { iconEl.classList.add("ph-sun"); iconEl.style.color = "#FFAB00"; }
        document.getElementById('weather-temp').innerText = wd.current.temperature_2m.toFixed(1);
        const feelsLike = Math.round(wd.current.apparent_temperature);
        document.getElementById('weather-feels').innerText = `체감 ${feelsLike}°`;
        const currentHour = new Date().getHours();
        const pop = wd.hourly.precipitation_probability[currentHour];
        document.getElementById('weather-pop').innerText = `강수 ${pop}%`;
    } catch (e) { console.log("날씨 로드 실패"); }
}

/** [PART 3] 환율 및 더치페이 계산 로직 **/
function calculateFinalRate() {
    const desc = document.getElementById('rate-desc');
    const spreadPercentText = document.getElementById('spread-percent-text');
    if (rateType === 'base') {
        currentRate = baseRate;
        document.getElementById('spread-box').style.opacity = "0.2";
        desc.innerHTML = `<i class="ph-bold ph-info"></i> 수수료가 없는 <b>매매기준율</b>이 적용 중입니다.`;
    } else {
        const spread = baseRate * 0.0175;
        currentRate = baseRate + (spread * (1 - (spreadPercent / 100)));
        document.getElementById('spread-box').style.opacity = "1";
        if (spreadPercentText) spreadPercentText.innerText = spreadPercent + "%";
        if (spreadPercent == 100) { desc.innerHTML = `<i class="ph-bold ph-info"></i> <b>100% 우대</b>로 매매기준율과 동일하게 계산됩니다.`; }
        else { desc.innerHTML = `<i class="ph-bold ph-info"></i> 수수료 1.75%에 <b>${spreadPercent}% 우대</b>가 적용된 환율입니다.`; }
    }
    document.getElementById('rate-display').innerText = (currentRate * 100).toFixed(2);
    calculateDutch();
}

function calculateDutch() {
    const jpyInput = document.getElementById('jpy-input').value;
    const krwResult = document.getElementById('krw-result');
    const totalKrwResult = document.getElementById('total-krw-result');
    const jpyPerPerson = document.getElementById('jpy-per-person');
    if (jpyInput && currentRate) {
        const totalKrw = (jpyInput / 100) * (currentRate * 100);
        const perPersonJpy = jpyInput / people;
        const perPersonKrw = totalKrw / people;
        krwResult.style.opacity = "0.5";
        jpyPerPerson.style.opacity = "0.5";
        setTimeout(() => {
            totalKrwResult.innerText = Math.round(totalKrw).toLocaleString();
            krwResult.innerText = Math.round(perPersonKrw).toLocaleString();
            jpyPerPerson.innerText = Math.round(perPersonJpy).toLocaleString();
            krwResult.style.opacity = "1";
            jpyPerPerson.style.opacity = "1";
        }, 50);
    } else {
        totalKrwResult.innerText = '0';
        krwResult.innerText = '0';
        if(jpyPerPerson) jpyPerPerson.innerText = '0';
    }
}

function updateRateType(t) {
    rateType = t;
    const b = document.getElementById('btn-rate-base'), c = document.getElementById('btn-rate-cash');
    if (t === 'base') {
        b.className = "flex-1 py-3 text-sm font-bold rounded-xl bg-[#3182F6] text-white shadow-sm";
        c.className = "flex-1 py-3 text-sm font-bold text-gray-400";
    } else {
        c.className = "flex-1 py-3 text-sm font-bold rounded-xl bg-[#3182F6] text-white shadow-sm";
        b.className = "flex-1 py-3 text-sm font-bold text-gray-400";
    }
    calculateFinalRate();
}

function updateSpread(v) {
    spreadPercent = v;
    document.getElementById('spread-label').innerText = v + "% 우대";
    calculateFinalRate();
}

function changePeople(delta) {
    people += delta;
    if (people < 1) people = 1;
    document.getElementById('people-count').innerText = people;
    calculateDutch();
}

// 환율 등락폭 실제 계산 및 UI 업데이트
async function updateRateTrend(currentRate) {
    const percentEl = document.getElementById('rate-trend-percent');
    const diffEl = document.getElementById('rate-trend-diff');
    const iconEl = document.getElementById('rate-trend-icon');
    const barEl = document.getElementById('rate-trend-bar');

    if (!percentEl || !currentRate) return;

    try {
        // 1. 어제 날짜 구하기 (주말 고려하여 안전하게 2~3일 전 데이터 요청 가능)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        // 2. 어제 자 환율 가져오기
        const response = await fetch(`https://api.frankfurter.app/${dateStr}?from=JPY&to=KRW`);
        const data = await response.json();
        const yesterdayRate = data.rates.KRW;

        // 3. 오늘 환율과 비교 계산 (100엔 기준)
        const diff = (currentRate * 100) - (yesterdayRate * 100);
        const percent = (diff / (yesterdayRate * 100) * 100).toFixed(2);
        
        // 4. 상승/하락에 따른 UI 결정
        const isUp = diff >= 0;
        const color = isUp ? '#F04452' : '#3182F6'; // 상승 빨강, 하락 파랑
        const icon = isUp ? 'ph-caret-up' : 'ph-caret-down';
        const sign = isUp ? '+' : '';

        // 5. 반영
        percentEl.innerText = `${sign}${percent}%`;
        percentEl.style.color = color;
        diffEl.innerText = `${isUp ? '▲' : '▼'} ${Math.abs(diff).toFixed(2)}원`;
        diffEl.style.color = color;
        
        iconEl.className = `ph-bold ${icon}`;
        iconEl.style.color = color;
        
        // 그래프 바 애니메이션 (등락폭에 따라 20%~80% 사이로 가변)
        const barWidth = Math.min(Math.max(Math.abs(percent) * 50, 20), 80);
        setTimeout(() => {
            barEl.style.width = `${barWidth}%`;
            barEl.style.backgroundColor = color;
        }, 500);

    } catch (e) {
        console.log("트렌드 로드 실패, 기본값 유지");
        percentEl.innerText = "연결중";
    }
}

/** [PART 4] 지도 및 일정 **/
let map = L.map('map', { zoomControl: false });
let markers = [];

function updateMap(day) {
    currentDay = day;
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    const list = document.getElementById('schedule-list');
    list.innerHTML = "";
    const dayInfo = schedules[day];
    const dayData = dayInfo ? dayInfo.items : null;
    const bounds = [];
    if (dayData) {
        dayData.forEach((item, index) => {
            let markerColor = "#3182F6"; 
            let iconClass = "ph-fill ph-map-pin";
            if (item.place.includes("식사") || item.desc.includes("식사")) {
                markerColor = "#FF5D5D"; iconClass = "ph-fill ph-fork-knife";
            } else if (item.place.includes("공항") || item.place.includes("이동")) {
                markerColor = "#4E5968"; iconClass = "ph-fill ph-train";
            } else { markerColor = "#3182F6"; iconClass = "ph-fill ph-camera"; }
            const customIcon = L.divIcon({
                className: 'custom-marker animate-marker',
                html: `<div class="marker-body" style="background-color: ${markerColor};"><i class="${iconClass}"></i></div>`,
                iconSize: [32, 32], iconAnchor: [16, 32]
            });
            const m = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);
            m.bindPopup(`<b style="font-family:Pretendard;">${item.place}</b><br><span style="font-size:12px; color:#8B95A1;">${item.desc}</span>`);
            markers.push(m);
            bounds.push([item.lat, item.lng]);
            const isFood = item.place.includes("식사") || item.desc.includes("식사");
            const typeColor = isFood ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500";
            list.innerHTML += `<div class="toss-card flex gap-5 p-6 mb-0 cursor-pointer active:scale-95 transition" onclick="focusMap(${item.lat}, ${item.lng})"><div class="flex-shrink-0 w-10 text-center"><div class="w-8 h-8 rounded-full bg-[#333D4B] text-white text-sm flex items-center justify-center font-bold">${index + 1}</div></div><div class="flex-grow"><div class="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1"><span>${item.time}</span><span class="px-2 py-0.5 rounded-full ${typeColor}">${isFood ? "식사" : "일정"}</span></div><h3 class="text-xl font-bold text-[#191F28]">${item.place}</h3><p class="text-sm text-[#8B95A1] mt-1">${item.desc}</p></div></div>`;
        });
        if (bounds.length > 0) { map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 }); }
    }
    document.querySelectorAll('.day-btn').forEach(btn => {
        if (btn.dataset.day == day) {
            btn.classList.add('bg-[#3182F6]', 'text-white', 'shadow-md');
            btn.classList.remove('bg-white', 'text-gray-500');
        } else {
            btn.classList.remove('bg-[#3182F6]', 'text-white', 'shadow-md');
            btn.classList.add('bg-white', 'text-gray-500');
        }
    });
}

function focusMap(la, ln) {
    const mapElement = document.getElementById('map');
    if (mapElement) {
        const offset = 90;
        const elementPosition = mapElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    map.flyTo([la, ln], 17, { animate: true, duration: 1.2 });
    markers.forEach(m => {
        if (Math.abs(m.getLatLng().lat - la) < 0.0001 && Math.abs(m.getLatLng().lng - ln) < 0.0001) { m.openPopup(); }
    });
}

function resetMap() {
    const dayInfo = schedules[currentDay];
    if (dayInfo && dayInfo.items.length > 0) {
        const bounds = dayInfo.items.map(item => [item.lat, item.lng]);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    }
}

/** [PART 5] UI 제어 **/
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.replace('text-[#3182F6]', 'text-[#8B95A1]');
        btn.classList.remove('bg-white', 'shadow-sm');
    });
    const activeBtn = document.getElementById('btn-' + tab);
    activeBtn.classList.replace('text-[#8B95A1]', 'text-[#3182F6]');
    activeBtn.classList.add('bg-white', 'shadow-sm');
    if (tab === 'plan') setTimeout(() => { map.invalidateSize(); }, 300);
}

function toggleTicket(id) {
    const el = document.getElementById(id);
    const btnId = 'btn-text-' + id.split('-')[1];
    const btn = document.getElementById(btnId);
    const isExpanded = el.classList.toggle('expanded');
    if (btn) {
        btn.innerText = isExpanded ? "닫기" : "열기";
        if (isExpanded) { btn.classList.replace('bg-purple-50', 'bg-gray-100'); btn.classList.replace('text-purple-500', 'text-gray-400'); }
        else { btn.classList.replace('bg-gray-100', 'bg-purple-50'); btn.classList.replace('text-gray-400', 'text-purple-500'); }
    }
}

async function doTranslate() {
    const input = document.getElementById('trans-input').value;
    const output = document.getElementById('trans-output');
    const resultBox = document.getElementById('trans-result-box');
    
    if (!input.trim()) return;

    // 결과창 보여주기 및 로딩 표시
    resultBox.classList.remove('hidden');
    document.getElementById('trans-loading').classList.remove('hidden');
    output.classList.add('hidden');

    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=ko|ja`);
        const data = await res.json();
        
        document.getElementById('trans-loading').classList.add('hidden');
        output.classList.remove('hidden');
        output.innerText = data.responseData.translatedText;

        // [추가] 번역 완료 후 결과창으로 부드럽게 스크롤 이동
        setTimeout(() => {
            const offset = 100; // 상단바 높이 등을 고려한 여백
            const elementPosition = resultBox.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }, 100);

    } catch (e) { 
        output.innerText = "번역에 실패했습니다."; 
        document.getElementById('trans-loading').classList.add('hidden');
        output.classList.remove('hidden');
    }
}

function quickTrans(text) { document.getElementById('trans-input').value = text; doTranslate(); }
function copyText() { const text = document.getElementById('trans-output').innerText; navigator.clipboard.writeText(text).then(() => alert("복사되었습니다!")); }

window.onload = function () {
    map.setView([35.6895, 139.6917], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© CARTO', subdomains: 'abcd', maxZoom: 20 }).addTo(map);
    fetchAllData();
    setTimeout(() => updateMap(1), 200);
};
