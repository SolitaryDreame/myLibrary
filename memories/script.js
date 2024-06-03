// -------------------- Variables --------------------

var accuracy = false;
var url, watcher, data, save;
var currentChapter = 0;

// ------------------------------ onLoad ------------------------------

window.onload = () => {
  // Check for saved data
  save = JSON.parse(localStorage.getItem("savedBook"));
  if (save != null) {
    document.querySelector("#url").value = save.link;
  } else {
    save = false;
  }
};

// ------------------------------ MAIN CONTENT ------------------------------

function getData() {
  url = document.querySelector("#url").value;
  if (url == "testing") {
    url = "https://solitarydreame.github.io/myLibrary/resources/testingLoc.json";
  }
  fetch(url).then((resp) => {return resp.json();}).then((json) => {
    data = json;
    document.querySelector("#summary p").innerHTML = data.head.description;
    document.querySelector("#details p").innerHTML = `
      Könyv adatai:<br>
      Író: ${data.foot.creator}<br>
      Dátum: ${data.foot.date}<br>
    `;
    if (save) {
      for (let j = 0; j < data.body.length; j++) {
        if (data.body[j].code == save.progress) {
          currentChapter = j + 1;
          document.querySelector("#code span").innerHTML = data.body[j].code;
          break;
        }
      }
    } else {
      save = {link: url, progress: ""};
      localStorage.setItem("savedBook", JSON.stringify(save));
    }
    loadHistory(data);
    document.querySelector("#bookmark").classList.toggle("noDisplay");
    document.querySelector("#code").classList.toggle("noDisplay");
    document.querySelector("#close").innerHTML = "Close Book";
    letsTrack();
  }).catch((err) => {
    window.alert(err.message);
  });
}

function loadHistory(dataJSON) {
  let html = "";
  for(let i = 0; i < dataJSON.body.length; i++) {
    html += `<li>
        <a class="${(i < currentChapter) ? "" : "notFound"}"
        href="javascript:void(0)" onclick="displayChapter(data.body[${i}], this)">
        ${i + 1}. Fejezet
        </a>
      </li>`;
  }
  document.querySelector("#history ul").innerHTML = html;
}

function letsTrack() {
  if (navigator.geolocation) {
    document.querySelectorAll("#history ul li a")
      .forEach (e => e.style.fontWeight = '');
    if (data.body[currentChapter]) {
      watcher = navigator.geolocation.watchPosition((pos) => {
        let currentData = data.body[currentChapter];
        let page = document.querySelector("article");
        if (distance(pos.coords, currentData.location, true)) {
          displayChapter(currentData);
          document.querySelector("#code span").innerHTML = currentData.code;
          save.progress = currentData.code;
          localStorage.setItem("savedBook", JSON.stringify(save));
          currentChapter++;
          loadHistory(data);
        } else {
          page.innerHTML = `<p>${currentData.message}</p>`;
        }
      }, (err) => {
        console.log(err.message);
        navigator.geolocation.clearWatch(watcher);
        watcher = undefined;
        document.querySelector("article").innerHTML = 
          `<button onclick="letsTrack()">Folytatás</button>`;
      }, { enableHighAccuracy: accuracy});
    } else {
      document.querySelector("article").innerHTML = "<p>A könyv végéhez értél!!!</p>";
    }
  } else {
    window.alert("Geolocation nem támogatott ebben a böngészőben.");
  }
}

function displayChapter(chapter, item = null) {
  if (item != null) {
    document.querySelectorAll("#history ul li a")
      .forEach (e => e.style.fontWeight = '');
    item.style.fontWeight = "bold";
  }
  navigator.geolocation.clearWatch(watcher);
  watcher = undefined;
  let page = document.querySelector("article");
  switch (chapter.content.type) {
            case "text": 
              page.innerHTML = `<p>${chapter.content.data}</p>`;
              break;
            case "picture":
              page.innerHTML = `<img src=${chapter.content.data}>`;
              break;
            case "video":
              page.innerHTML = `
                <video controls>
                  <source src=${chapter.content.data}>
                  A böngésző nem támogatja a video tag-et.
                </video>`;
              break;
            case "special":
              page.innerHTML = chapter.content.data;
              break;
            default:
              page.innerHTML = `<p>Nem megjeleníthehő: ${chapter.content.data}</p>`
          }
  page.innerHTML += `
  <p>Könyvjelző kód: ${chapter.code}</p>
  <button onclick='letsTrack()'>Folytatás</button>
  `;
}

function distance(center, target, onTarget = false) {
  let x = center.latitude - target.latitude;
  let y = center.longitude - target.longitude;
  let d = Math.sqrt(x * x + y * y) * 111139;
  if (!onTarget) {
    return d;
  } else {
    return (center.accuracy + target.accuracy) > d;
  }
}

document.querySelector("#url").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {document.querySelector("#startBtn").click();}
});

// -------------------- Toggle Sidebars --------------------

function toggleSdbr(x) {
  document.querySelector(`#${x}`).classList.toggle("active");
  document.querySelector(`#${x} ul`).classList.toggle("noDisplay");
  document.querySelector(`#${x} div`).classList.toggle("noDisplay");
}

// ------------------------------ SETTINGS ------------------------------

// -------------------- Dark Mode --------------------
//              dark  -  light
//  --bckgrnd: 2A2442 - FFEBC2
//  --txt:     FFEBC2 - 2A2442
//  --sdbr:    3A335C - FFE2AD
//  --cntnt:   332B50 - FFE5B4

function darkMode() {
  let checkBox = document.querySelector("#darkMode");
  let r = document.querySelector(":root");
  
  if (checkBox.checked){
    r.style.setProperty("--bckgrnd", "#2A2442");
    r.style.setProperty("--txt", "#FFEBC2");
    r.style.setProperty("--sdbr", "#3A335C");
    r.style.setProperty("--cntnt", "#332B50");
  } else {
    r.style.setProperty("--bckgrnd", "#FFEBC2");
    r.style.setProperty("--txt", "#2A2442");
    r.style.setProperty("--sdbr", "#FFE2AD");
    r.style.setProperty("--cntnt", "#FFE5B4");
  }
}

// -------------------- High Accuracy --------------------

function setHighAcc() {
  accuracy = document.querySelector("#highAccuracy").checked;
  if(accuracy) {
    document.querySelector("#accuracyLabel").innerHTML = "Alacsony pontosság: ";
  } else {
    document.querySelector("#accuracyLabel").innerHTML = "Magas pontosság: ";
  }
  if (watcher) {
    navigator.geolocation.clearWatch(watcher);
    watcher = undefined;
    letsTrack();
  }
}

// -------------------- Bookmark --------------------

function goTo() {
    let checkCode = document.querySelector("#bookmark input");
    if (checkCode.value.length == 6) {
        for (let j = 0; j < data.body.length; j++) {
          if (data.body[j].code == checkCode.value) {
            document.querySelector("#code span").innerHTML = data.body[j].code;
            currentChapter = j + 1;
            loadHistory(data);
            displayChapter(data.body[j]);
            checkCode.value = "";
            save.progress = data.body[j].code;
            localStorage.setItem("savedBook", JSON.stringify(save));
            break;
          }
        }
      }
}

document.querySelector("#bookmark input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {document.querySelector("#goTo").click();}
});

// Closer...

function closer() {
  if(!data) {
    localStorage.removeItem("savedBook");
  }
  location.reload();
}

// -------------------- ADDITIONAL INFORMATION --------------------

// JSON TEMPLATE
// {
//   head: {
//     type: linear*|non-linear,
//     description: (string),
//     name: (string)
//   },
//   body: [
//     {
//       location: {
//         longitude: (double), /degree/
//         latitude: (double), /degree/
//         accuracy: (double) /meter/
//                 },
//       message: (string),
//       content: {
//         type: text|picture|video|special*
//         data: (string) /text|url|html/
//       }
//       code: (string) /6 digit/
//     },
//     ...
//   ]
//   foot: {
//     creator: (string),
//     date: (string)
//   }
// }