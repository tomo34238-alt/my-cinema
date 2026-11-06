MY CINEMA - PWA版

■ できること
・映画記録の追加、編集、削除
・鑑賞日、ジャンル、評価（★1〜5）、感想、印象に残ったシーン、考察
・お気に入り、検索、ジャンル絞り込み、並び替え
・鑑賞数、平均評価、お気に入り数、今月の鑑賞数
・JSONバックアップの書き出し／読み込み
・TMDB APIを使った映画検索（APIキー設定時）
・PWAとしてホーム画面に追加、アプリシェルのオフライン起動

■ 重要：保存について
映画データはブラウザのlocalStorageに保存されます。
同じ端末・同じブラウザ内で使う個人用の初期版です。
ブラウザデータを消去すると記録も消える可能性があります。
設定画面から定期的にJSONバックアップを書き出してください。
複数端末同期やアカウント機能はまだありません。

■ 起動方法（Windows）
PWAのService Workerは file:// では動かないため、ローカルサーバーで起動します。
1. ZIPを展開し、my-cinema-pwaフォルダを開く
2. VS Codeでフォルダを開く
3. VS Codeの拡張機能「Live Server」をインストール
4. index.htmlを右クリック → Open with Live Server
5. ブラウザでアプリが開きます

Pythonがインストール済みなら、フォルダ内で次のコマンドでも起動できます。
  python -m http.server 8000
その後、ブラウザで http://localhost:8000 を開きます。

■ iPhoneで使う方法
iPhoneでPWAとして使うには、HTTPSで公開されたURLが必要です。
ローカルPCのlocalhostをiPhoneから直接使うことはできません。
GitHub PagesなどHTTPS対応の静的ホスティングへ配置すると利用できます。
iPhoneのSafariで公開URLを開き、共有ボタン →「ホーム画面に追加」を選びます。
ホーム画面から起動するとアプリ風に表示されます。
※ホスティング先は公開URLになるため、個人の記録データ自体は端末内に保存されますが、APIキーを含むアプリコードは公開され得ます。

■ TMDB検索の設定
TMDB検索は任意です。設定（右下の歯車）にTMDB API Read Access Tokenを登録してください。
TMDBのアカウントでAPI利用申請を行い、API Read Access Tokenを取得します。
設定したキーはこのブラウザのlocalStorageに保存されます。
この実装は個人用の試作向けで、APIキーをブラウザに置く方式です。
公開サービスとして配布する場合は、キーをサーバー側で保護する構成に変更してください。
検索結果の作品を選ぶとタイトルとポスターURLを入力できます。ジャンルは必要に応じて手入力してください。

TMDB attribution:
This product uses the TMDB API but is not endorsed or certified by TMDB.
TMDB logo and attribution requirements should be followed if you publish or distribute this app.
API terms: https://www.themoviedb.org/documentation/api/terms-of-use

■ バックアップ
設定画面 →「データを書き出す」でJSONファイルを保存できます。
復元すると現在のデータを置き換えるため、必要なら先にバックアップしてください。
