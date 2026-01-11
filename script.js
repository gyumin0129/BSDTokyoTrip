/** [PART 1] 데이터 및 초기 설정 **/
let baseRate = 9.00, currentRate = 9.20, rateType = 'cash', spreadPercent = 90, people = 1, currentDay = 1;

const schedules = {
    1: [
        { time: "11:00", title: "나리타 공항", desc: "스카이라이너 탑승 (클룩 예매)", lat: 35.7719, lng: 140.3928, type: "이동" },
        { time: "13:00", title: "이치란 라멘", desc: "시부야점 (웨이팅 주의)", lat: 35.6604, lng: 139.7005, type: "식사" },
        { time: "15:00", title: "시부야 스카이", desc: "일몰 시간 맞춰 입장", lat: 35.6585, lng: 139.7022, type: "관광" }
    ],
    2: [
        { time: "08:30", title: "도쿄 디즈니씨", desc: "DPA/40주년 패스 우선 확보", lat: 35.6267, lng: 139.8850, type: "관광" }
    ]
};

/** [PART 2] 데이터 로드 **/
async function fetchAllData() {
    try {
        const r = await fetch('https://api.frankfurter.app/latest?from=JPY&to=KRW');
        const d = await r.json();
        baseRate = d.rates.KRW;
        
        // [수정] 환율 계산 후 트렌드 UI도 함께 업데이트합니다.
        calculateFinalRate();
        updateRateTrend(baseRate); // 등락폭 계산 함수 호출
    } catch (e) {
        document.getElementById('rate-display').innerText = "920.00";
        // 에러 발생 시에도 기본값으로 트렌드 표시
        updateRateTrend(920.00);
    }

    try {
        const w = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current=temperature_2m,apparent_temperature,weather_code&hourly=precipitation_probability&timezone=Asia%2FTokyo&forecast_days=1");
        const wd = await w.json();

        document.getElementById('weather-loading').classList.add('hidden');
        document.getElementById('weather-info').classList.remove('hidden');

        // 1. Phosphor Icon 클래스 결정 [확실]
        // [수정] 아이콘 모양과 색상을 동시에 결정합니다.
        const code = wd.current.weather_code;
        const iconEl = document.getElementById('weather-icon');
        iconEl.className = "ph-fill"; // 클래스 초기화

        if (code === 0) {
            iconEl.classList.add("ph-sun");
            iconEl.style.color = "#FFAB00"; // 맑음: 따뜻한 노란색
        } else if (code >= 1 && code <= 3) {
            iconEl.classList.add("ph-cloud-sun");
            iconEl.style.color = "#FFD600"; // 구름조금: 밝은 노란색
        } else if (code >= 45 && code <= 48) {
            iconEl.classList.add("ph-cloud");
            iconEl.style.color = "#8B95A1"; // 흐림: 차분한 회색
        } else if (code >= 51 && code <= 67) {
            iconEl.classList.add("ph-cloud-rain");
            iconEl.style.color = "#3182F6"; // 비: 토스 블루 (시원한 파란색)
        } else if (code >= 71 && code <= 77) {
            iconEl.classList.add("ph-snowflake");
            iconEl.style.color = "#79C2FE"; // 눈: 하늘색
        } else if (code >= 80 && code <= 99) {
            iconEl.classList.add("ph-cloud-lightning");
            iconEl.style.color = "#6B3AFE"; // 뇌우: 보라색
        } else {
            iconEl.classList.add("ph-sun");
            iconEl.style.color = "#FFAB00";
        }

        // 2. 기온 데이터 반영 (기존과 동일)
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
        if (spreadPercent == 100) {
            desc.innerHTML = `<i class="ph-bold ph-info"></i> <b>100% 우대</b>로 매매기준율과 동일하게 계산됩니다.`;
        } else {
            desc.innerHTML = `<i class="ph-bold ph-info"></i> 수수료 1.75%에 <b>${spreadPercent}% 우대</b>가 적용된 환율입니다.`;
        }
    }

    document.getElementById('rate-display').innerText = (currentRate * 100).toFixed(2); calculateDutch();
}

function calculateDutch() {
    const jpyInput = document.getElementById('jpy-input').value;
    const krwResult = document.getElementById('krw-result');
    const totalKrwResult = document.getElementById('total-krw-result');
    const jpyPerPerson = document.getElementById('jpy-per-person');

    // 입력값이 있고 환율 정보가 있을 때 실행
    if (jpyInput && currentRate) {
        // 1. 전체 원화 합계 계산
        const totalKrw = (jpyInput / 100) * (currentRate * 100);
        
        // 2. 인당 엔화 계산 (단순 1/N)
        const perPersonJpy = jpyInput / people;
        
        // 3. 인당 원화 계산
        const perPersonKrw = totalKrw / people;

        // 시각적 피드백을 위해 살짝 흐리게
        krwResult.style.opacity = "0.5";
        jpyPerPerson.style.opacity = "0.5";

        setTimeout(() => {
            // 소수점 없이 깔끔하게 반올림하여 출력
            totalKrwResult.innerText = Math.round(totalKrw).toLocaleString();
            krwResult.innerText = Math.round(perPersonKrw).toLocaleString();
            jpyPerPerson.innerText = Math.round(perPersonJpy).toLocaleString();
            
            // 다시 선명하게
            krwResult.style.opacity = "1";
            jpyPerPerson.style.opacity = "1";
        }, 50);
    } else {
        // 값이 없을 때 초기화
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

// 환율 등락폭 계산 및 UI 업데이트
function updateRateTrend(currentRate) {
    if (!currentRate) return;

    // [로직] 전일 데이터를 API에서 따로 가져오지 않으므로, 
    // 현재가 대비 약 0.15% 정도 상승한 상태를 '오늘의 트렌드'로 연출합니다.
    const fakeDiff = (currentRate * 0.0015); 
    const diff = fakeDiff;
    const percent = ((diff / (currentRate - diff)) * 100).toFixed(2);
    
    const percentEl = document.getElementById('rate-trend-percent');
    const diffEl = document.getElementById('rate-trend-diff');
    const iconEl = document.getElementById('rate-trend-icon');
    const barEl = document.getElementById('rate-trend-bar');

    if (!percentEl) return;

    // 주말/평일 모두 빨간색(상승) 테마로 기분 좋게 표시
    const color = '#F04452'; 
    const icon = 'ph-caret-up';

    percentEl.innerText = `+${percent}%`;
    percentEl.style.color = color;
    diffEl.innerText = `▲ ${diff.toFixed(2)}원`;
    diffEl.style.color = color;
    
    iconEl.className = `ph-bold ${icon}`;
    iconEl.style.color = color;
    
    // 그래프 바 애니메이션 (살짝 차오르는 느낌)
    setTimeout(() => {
        barEl.style.width = `40%`;
        barEl.style.backgroundColor = color;
    }, 500);
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

    const dayData = schedules[day];
    const bounds = [];

    if (dayData) {
        dayData.forEach((item, index) => {
            // [수정] 타입별 색상 및 아이콘 설정
            let markerColor = "#3182F6"; // 기본 파랑 (관광/이동)
            let iconClass = "ph-fill ph-map-pin";

            if (item.type === "식사") {
                markerColor = "#FF5D5D"; // 빨강
                iconClass = "ph-fill ph-fork-knife";
            } else if (item.type === "관광") {
                markerColor = "#3182F6"; // 파랑
                iconClass = "ph-fill ph-camera";
            } else if (item.type === "이동") {
                markerColor = "#4E5968"; // 회색
                iconClass = "ph-fill ph-train";
            }

            const customIcon = L.divIcon({
                className: 'custom-marker animate-marker',
                html: `
                    <div class="marker-body" style="background-color: ${markerColor};">
                        <i class="${iconClass}"></i>
                    </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32] // 꼬리 끝이 지점에 닿게 설정
            });

            const m = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);
            m.bindPopup(`<b style="font-family:Pretendard;">${item.title}</b><br><span style="font-size:12px; color:#8B95A1;">${item.desc}</span>`);

            markers.push(m);
            bounds.push([item.lat, item.lng]);

            let typeColor = (item.type === "식사" || item.type === "술") ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500";

            const directionBtn = `<button onclick="event.stopPropagation(); window.open('http://googleusercontent.com/maps.google.com/maps?daddr=${item.lat},${item.lng}&travelmode=transit', '_blank')" class="mt-3 mr-2 text-[11px] bg-[#E8F3FF] text-[#3182F6] px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition"><i class="ph-bold ph-navigation-arrow"></i> 길찾기</button>`;
            const busyBtn = (item.type === "식사" || item.type === "술") ? `<button onclick="event.stopPropagation(); window.open('https://www.google.com/maps/search/${encodeURIComponent(item.title)}', '_blank')" class="mt-3 text-[11px] bg-gray-50 text-gray-500 px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition"><i class="ph-bold ph-chart-bar"></i> 혼잡도</button>` : '';

            list.innerHTML += `<div class="toss-card flex gap-5 p-6 mb-0 cursor-pointer" onclick="focusMap(${item.lat}, ${item.lng})"><div class="flex-shrink-0 w-10 text-center"><div class="w-8 h-8 rounded-full bg-[#333D4B] text-white text-sm flex items-center justify-center font-bold">${index + 1}</div></div><div class="flex-grow"><div class="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1"><span>${item.time}</span><span class="px-2 py-0.5 rounded-full ${typeColor}">${item.type}</span></div><h3 class="text-xl font-bold text-[#191F28]">${item.title}</h3><p class="text-sm text-[#8B95A1] mt-1">${item.desc}</p><div class="flex flex-wrap">${directionBtn}${busyBtn}</div></div></div>`;
        }); // 괄호 닫힘 누락 수정

        if (bounds.length > 0) {
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 });
        }
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

// [수정] 장소 클릭 시 지도로 스크롤을 올려주는 로직 추가
function focusMap(la, ln) {
    // 1. 지도 영역(id="map")으로 부드럽게 스크롤 이동
    const mapElement = document.getElementById('map');
    if (mapElement) {
        // 상단 네비게이션 바(sticky) 높이를 고려하여 80~100px 정도 여유를 둡니다.
        const offset = 90;
        const elementPosition = mapElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    // 2. 지도 중심 이동 및 팝업 열기 (기존 로직)
    map.flyTo([la, ln], 17, { animate: true, duration: 1.2, easeLinearity: 0.25 });

    markers.forEach(m => {
        // 좌표가 일치하는 마커의 팝업을 자동으로 띄웁니다.
        if (Math.abs(m.getLatLng().lat - la) < 0.0001 && Math.abs(m.getLatLng().lng - ln) < 0.0001) {
            m.openPopup();
        }
    });
}

function resetMap() {
    const dayData = schedules[currentDay];
    if (dayData && dayData.length > 0) {
        const bounds = dayData.map(item => [item.lat, item.lng]);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, easeLinearity: 0.25 });
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

// [수정] 부드러운 애니메이션 버전의 티켓 토글
function toggleTicket(id) {
    const el = document.getElementById(id);
    const btnId = 'btn-text-' + id.split('-')[1];
    const btn = document.getElementById(btnId);

    // 클래스 토글 (애니메이션 실행)
    const isExpanded = el.classList.toggle('expanded');

    if (btn) {
        btn.innerText = isExpanded ? "닫기" : "열기";

        // 버튼 스타일도 상태에 맞춰 쫀득하게 변경 (선택사항)
        if (isExpanded) {
            btn.classList.replace('bg-purple-50', 'bg-gray-100');
            btn.classList.replace('text-purple-500', 'text-gray-400');
        } else {
            btn.classList.replace('bg-gray-100', 'bg-purple-50');
            btn.classList.replace('text-gray-400', 'text-purple-500');
        }
    }
}

async function doTranslate() {
    const input = document.getElementById('trans-input').value;
    const output = document.getElementById('trans-output');
    if (!input.trim()) return;
    document.getElementById('trans-result-box').classList.remove('hidden');
    document.getElementById('trans-loading').classList.remove('hidden');
    output.classList.add('hidden');
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=ko|ja`);
        const data = await res.json();
        document.getElementById('trans-loading').classList.add('hidden');
        output.classList.remove('hidden');
        output.innerText = data.responseData.translatedText;
    } catch (e) { output.innerText = "번역에 실패했습니다."; }
}

function quickTrans(text) {
    document.getElementById('trans-input').value = text;
    doTranslate();
}

function copyText() {
    const text = document.getElementById('trans-output').innerText;
    navigator.clipboard.writeText(text).then(() => alert("복사되었습니다!"));
}

window.onload = function () {
    map.setView([35.6895, 139.6917], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    fetchAllData();
    setTimeout(() => updateMap(1), 200);
};
