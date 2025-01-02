// Webカメラの起動
const video = document.getElementById('video');
let contentWidth;
let contentHeight;

const media = navigator.mediaDevices.getUserMedia({ audio: false, video: {width:480, height:480} })
   .then((stream) => {
      video.srcObject = stream;
      video.onloadeddata = () => {
         video.play();
         contentWidth = video.clientWidth;
         contentHeight = video.clientHeight;
         canvasUpdate();
         checkImage();
      }
   }).catch((e) => {
      console.log(e);
   });

// カメラ映像のキャンバス表示
const cvs = document.getElementById('camera-canvas');
const ctx = cvs.getContext('2d');
const canvasUpdate = () => {
   cvs.width = contentWidth;
   cvs.height = contentHeight;
   ctx.drawImage(video, 0, 0, contentWidth, contentHeight);
   requestAnimationFrame(canvasUpdate);
}

// CSVファイルを読み込む関数
async function loadCSV(filePath) {
   try {
       // fetchを使ってCSVを取得
       const response = await fetch(filePath);
       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }

       // CSVデータをテキスト形式で取得
       const csvText = await response.text();

       // テキストを配列に変換
       const data = parseCSV(csvText);

       // 配列データを確認
       console.log(data);
   } catch (error) {
       console.error('Error loading CSV:', error);
   }
}

// CSVテキストを配列に変換する関数
function parseCSV(csvText) {
   const rows = csvText.split('\n').map(row => row.trim());
   const headers = rows[0].split(',');

   return rows.slice(1).map(row => {
       const values = row.split(',');
       return headers.reduce((obj, header, index) => {
           obj[header] = values[index];
           return obj;
       }, {});
   });
}

// CSVファイルを相対パスで読み込む
let data = [];
loadCSV('./data/sample.csv').then(loadedData => {
    data = loadedData;
    document.getElementById('data-msg').textContent = `座席データ：読み込み済み`;
    checkImage(); // データ読み込み後にQRコードの処理を開始
}).catch(error => {
    console.error('Error loading CSV:', error);
    document.getElementById('data-msg').textContent = `座席データ：読み込みエラー`;
});


// qrDataに合致する生徒情報を検索
const searchStudent = (data, qrData) => {
   for(let i=0; i<data.length; i++) {
      if(data[i].number === qrData) {
         return data[i];
      }
   }
   return null;
}

// QRコードの検出
let qrData = null;
const rectCvs = document.getElementById('rect-canvas');
const rectCtx =  rectCvs.getContext('2d');
const checkImage = () => {
   // imageDataを作る
   const imageData = ctx.getImageData(0, 0, contentWidth, contentHeight);
   // jsQRに渡す
   const code = jsQR(imageData.data, contentWidth, contentHeight);

   // 検出結果に合わせて処理を実施
   if (code) {
      qrData = code.data;
      let result = "";
      for (let i = 0; i < qrData.length; i++) {
         if (qrData[i] === ',') {
            break;
         } else {
            result += qrData[i];
         }
      }
      qrData = result;
      console.log("QRcodeが見つかりました", qrData);

      drawRect(code.location);
      document.getElementById('qr-msg').textContent = `QRコード：${qrData}`;
   } else {
      console.log("QRcodeが見つかりません…", code);
      rectCtx.clearRect(0, 0, contentWidth, contentHeight);
      document.getElementById('qr-msg').textContent = `QRコード: 見つかりません`;
   }
   requestAnimationFrame(checkImage);
}

// 四辺形の描画
const drawRect = (location) => {
   rectCvs.width = contentWidth;
   rectCvs.height = contentHeight;
   drawLine(location.topLeftCorner, location.topRightCorner);
   drawLine(location.topRightCorner, location.bottomRightCorner);
   drawLine(location.bottomRightCorner, location.bottomLeftCorner);
   drawLine(location.bottomLeftCorner, location.topLeftCorner)
}

// 線の描画
const drawLine = (begin, end) => {
   rectCtx.lineWidth = 4;
   rectCtx.strokeStyle = "#F00";
   rectCtx.beginPath();
   rectCtx.moveTo(begin.x, begin.y);
   rectCtx.lineTo(end.x, end.y);
   rectCtx.stroke();
}

// 結果の表示
if(data) {
   document.getElementById('data-msg').textContent = `座席データ：読み込み済み`;
   if (qrData) {
      const result = searchStudent(data, qrData);
      if (result && result.length > 0) {
         document.getElementById("result-number").innerText = `生徒番号：${result[0].number}`;
         document.getElementById("result-name").innerText = `氏名：${result[0].name}`;
         document.getElementById("result-room").innerText = `試験教室：${result[0].room}`;
         document.getElementById("result-sheet").innerText = `座席番号：${result[0].sheet}`;
      }
      else {// 該当なしの場合の処理
         document.getElementById("result-number").innerText = `該当する生徒情報が見つかりませんでした。`;
      }
   }
}
