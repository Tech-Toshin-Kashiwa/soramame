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

function csv2Array(filePath) { //csvﾌｧｲﾙﾉ相対ﾊﾟｽor絶対ﾊﾟｽ
	var csvData = new Array();
	var data = new XMLHttpRequest();	
	data.open("GET", filePath, false); //true:非同期,false:同期
	data.send(null);

	var LF = String.fromCharCode(10); //改行ｺｰﾄﾞ
	var lines = data.responseText.split(LF);

   // 1行目をラベル（キー）として取得
   var headers = lines[0].split(",");

   // 2行目からの処理
	for (var i = 1; i < lines.length;++i) {
		var cells = lines[i].split(",");
		if( cells.length != 1 ) {
			csvData.push(cells);
		}
	}
	return csvData;
}


// CSVファイルを相対パスで読み込む
let data = [];
data = csv2array('./data/sample.csv')

// CSVファイルの読み込み状況に応じてテキストを書き換える
if(data) {
   document.getElementById("data-msg").innerText = `座席データを読み込みました。`;
}

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
