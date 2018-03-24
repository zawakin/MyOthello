$(function () {
    const cnvs = $("#cnvs");
    if (ww < 600) {
        $("#cnvs").attr("width", ww);
        $("#cnvs").attr("height", ww);
    }
    cnvs.css("background-color", "darkgreen");

    const TURN = {
        NONE: 0,
        BLACK: 1,
        WHITE: 2
    }

    class GUI {
        constructor(Nsize, width, maneger) {
            this.Nsize = Nsize;
            this.width = width;
            this.cellsize = width / (Nsize + 1);
            this.mouse = { x: 0, y: 0 };
            this.Imouse = { xi: -1, yi: -1 };
            this.busy = false;
            this.ctx = cnvs[0].getContext("2d");
            this.maneger = maneger;
			this.thinking = false;
        }
        showSimulation() {
            var results = this.results;
            var ctx = this.ctx;
            ctx.fillStyle = "red";
            ctx.textAlign = "center";
            ctx.font = "100px sans-serif";
            ctx.fillText(results, this.width / 2, this.width / 2, 1000);
        }
        DrawBoard(board) {
            var ctx = this.ctx;
            //clear board
            this.ctx.clearRect(0, 0, this.width, this.width);
            //draw empty board
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            for (var i = 0; i <= this.Nsize; i++) {
                ctx.moveTo(this.cellsize * (i + 1 / 2), this.cellsize / 2);
                ctx.lineTo(this.cellsize * (i + 1 / 2), this.cellsize * (this.Nsize + 1 / 2));
                ctx.moveTo(this.cellsize / 2, this.cellsize * (i + 1 / 2));
                ctx.lineTo(this.cellsize * (this.Nsize + 1 / 2), this.cellsize * (i + 1 / 2));
            }
            ctx.closePath();
            ctx.stroke();
            // draw discs
            for (var xi = 0; xi < this.Nsize; xi++) {
                for (var yi = 0; yi < this.Nsize; yi++) {
                    if (board[yi][xi] != TURN.NONE) {
                        ctx.beginPath();
                        ctx.arc(
                            this.cellsize + xi * this.cellsize,
                            this.cellsize + yi * this.cellsize,
                            this.cellsize * 0.4,
                            0,
                            Math.PI * 2,
                            true
                        );
                        if (board[yi][xi] == TURN.BLACK) {
                            ctx.fillStyle = "black";
                        } else {
                            ctx.fillStyle = "white";
                        }
                        ctx.fill();
                    }
                }
            }

            for (let arr of this.maneger.get_okeru()) {
                var xi = arr[0]; var yi = arr[1];
                ctx.beginPath();
                ctx.arc(
                    this.cellsize + xi * this.cellsize,
                    this.cellsize + yi * this.cellsize,
                    this.cellsize * 0.1,
                    0,
                    Math.PI * 2,
                    true
                );
                ctx.fillStyle = "gray";
                ctx.fill();
            }

            if (this.passtimer > 0) {
                var ss = "";
                if (this.passturn == TURN.BLACK) ss = "Black";
                if (this.passturn == TURN.WHITE) ss = "White";
                var ctx = this.ctx;
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
                ctx.font = "100px sans-serif";
                ctx.fillText(ss + ": Pass", this.width / 2, this.width / 2, 1000);
                this.passtimer -= 1;
            }

            if (this.finishtimer > 0) {
                var ss = "引き分け！";
                if (this.finishResult == TURN.BLACK) ss = "黒の勝利！";
                if (this.finishResult == TURN.WHITE) ss = "白の勝利！";

                var ctx = this.ctx;
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
                ctx.font = "100px sans-serif";
                ctx.fillText(ss, this.width / 2, this.width / 2, 1000);
                this.finishtimer -= 1;
                if (this.finishtimer == 1) {
                    this.maneger.showMenu();
                }
            }
			if (this.thinking){
                var ss = "思考中...";
                var ctx = this.ctx;
                ctx.fillStyle = "grey";
                ctx.textAlign = "center";
                ctx.font = "50px sans-serif";
                ctx.fillText(ss, this.width / 2, this.width / 2, 1000);
			}

        }

        DrawBoardWithAnimation() {

        }
        showPass(turn) {
            this.passtimer = 10;
            this.passturn = turn;
        }
		showThinking(){
			this.thinking = true;
		}
        showFinishMessege(turn, result) {
            this.passtimer = 0;
            //this.passturn = turn;
            this.finishtimer = 45;
            this.finishResult = result;
        }
        update(mouse) {
            this.update_mouse(mouse);
        }
		click(){
			if (0 <= this.Imouse.xi
				& this.Imouse.xi < this.Nsize & 0 <= this.Imouse.yi & this.Imouse.yi < this.Nsize) {
				// ボードの中でクリックされたとき
				this.maneger.get_hand_from_gui(this.Imouse);
			}
		}
        update_mouse(mouse) {
            this.mouse.x = mouse.x;
            this.mouse.y = mouse.y;
            var xi = parseInt((this.mouse.x - this.cellsize / 2) / this.cellsize);
            var yi = parseInt((this.mouse.y - this.cellsize / 2) / this.cellsize);
            this.Imouse.xi = xi;
            this.Imouse.yi = yi;
        }

    }

    class OthelloController {
        constructor(Nsize, width) {
            this.Nsize = Nsize;
            this.gui = new GUI(Nsize, width, this);
            this.game = new Othello(Nsize);
            this.gameChu = false;
            this.waiting = false;
            this.okeru = [];
            this.passed = false;
            this.simulating = false;
        }
        update(mouse) {
            this.gui.update(mouse);
            this.gui.DrawBoard(this.game.board);
            clicked = false;
        }
        start() {
            $(".startbtn").hide();
			$(".cpubtn").hide();
			$("#back").show();
            $("#cnvs").removeClass("w3-opacity");
            //$("#infobox").show();
            this.update_to_next();
        }
        start_human() {
            this.gameChu = true;
            this.game = new Othello(this.Nsize);
            this.game.players.push(new Player());
            this.game.players.push(new Player());
            this.start();
        }
        start_cpu(num) {
            this.gameChu = true;
            if (num == 1) {
                this.game = new Othello(this.Nsize);
                this.game.players.push(new Player());
                this.game.players.push(new CPU(this.game));
            }
            if (num == 2) {
                this.game = new Othello(this.Nsize);
                this.game.players.push(new Player());
                this.game.players.push(new CPUOkeruRandom(this.game));
            }
            if (num == 3) {
                this.game = new Othello(this.Nsize);
                this.game.players.push(new Player());
                this.game.players.push(new CPUMonteCarloTree(this.game));
            }
            if (num == 4) {
                this.game = new Othello(this.Nsize);
            }
            if (num == 11) {
                //CPU同士戦わせる
                $(".startbtn").hide();
                $(".simulation").show();
                this.game = new Othello(this.Nsize);
                this.game.players.push(new CPU(this.game));
                this.game.players.push(new CPU(this.game));
                var results = [0, 0, 0];
                var ctx = this.gui.ctx;
                this.simulating = true;
                for (var i = 0; i < 1000; i++) {
                    var result = this.game.players[0].simulate(this.Nsize, this.game.board, this.game.turn);
                    results[result] += 1;
                }
                $("#label_sim").html("黒: " + results[1] + "<br/>白: " + results[2] + " <br/>引き分け: " + results[0] + "<br/>" + "黒の勝率: " + results[1] / 10 + " %<br/>");
                return;
            }
            this.start();
        }
        get_hand_from_gui(Imouse) {
            // マスをクリックしたときにGUIから呼ばれる関数。
            if (!this.gameChu) return;
            if (this.game.players[this.game.turn - 1].ishuman) {
                if (this.game.check_okeru(Imouse.xi, Imouse.yi)) {
                    // クリックしたところが合法手なら石をひっくり返す
                    this.game.put_disc(Imouse);
                    this.update_to_next();
                }
            }
        }
        update_to_next() {
            // 石をひっくり返したあとの処理を色々する。（okeruの更新）
            this.game.refresh_okeru();
            if (this.game.okeru.length == 0) {
                // 合法手がないとき。
                console.log("pass");
                this.gui.showPass(this.game.turn);
                this.game.turn = 3 - this.game.turn;
                this.game.refresh_okeru();
                if (this.game.okeru.length == 0) {
                    // パスが二回続いたとき終了する。
                    console.log("pass 2");
                    this.finish();
                    return;
                }
                this.update_to_next();
            } else {
                //合法手があるとき
                //CPUなら、手を考える。
                var player = this.game.players[this.game.turn - 1];
                if (player.iscpu) {
					if (this.game.players[(3-this.game.turn) - 1].iscpu){
						var te = player.think();
						this.game.put_disc({ xi: te[0], yi: te[1] });
						this.update_to_next();
					}else{
						function Temp(maneger, player){
							console.log("temp");
							var te = player.think();
							maneger.game.put_disc({ xi: te[0], yi: te[1] });
							maneger.update_to_next();
							maneger.gui.thinking = false;
						}
						this.gui.showThinking();
						setTimeout(Temp, 300, this, player);
					}
                }
            }
            // 終了してるか？
            if (this.game.isover()) {
                this.finish();
            }
        }
        finish() {
            var ncolors = this.game.count_colors();
            var result = TURN.NONE;
            if (ncolors["BLACK"] > ncolors["WHITE"]) result = TURN.BLACK;
            if (ncolors["BLACK"] < ncolors["WHITE"]) result = TURN.WHITE;
            this.gui.showFinishMessege(this.game.turn, result);
            this.gameChu = false;
        }
        get_okeru() {
            return this.game.okeru;
        }
        showMenu() {
            $(".startbtn").show();
            $("#cnvs").addClass("w3-opacity");
            $("#infobox").hide();
        }
    }

    class Othello {
        constructor(Nsize) {
            this.Nsize = Nsize;
            this.SetInitBoard();
            this.players = [];
            this.turn = 1; // 1: 黒番, 2: 白番

            this.okeru = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru(xi, yi)) {
                        this.okeru.push([xi, yi]);
                    }
                }
            }
        }

        SetInitBoard() {
            this.board = [];
            for (var i = 0; i < this.Nsize; i++) {
                this.board[i] = [];
                for (var j = 0; j < this.Nsize; j++) {
                    this.board[i][j] = TURN.NONE;
                }
            }
            this.board[this.Nsize / 2 - 1][this.Nsize / 2 - 1] = TURN.WHITE;
            this.board[this.Nsize / 2][this.Nsize / 2] = TURN.WHITE;
            this.board[this.Nsize / 2 - 1][this.Nsize / 2] = TURN.BLACK;
            this.board[this.Nsize / 2][this.Nsize / 2 - 1] = TURN.BLACK;
        }
        put_disc(Imouse) {
            // 合法手か判定したあとに呼ぶ。ひっくり返し、手番を交代する。
            // ひっくり返した石を配列で返す
            var xi = Imouse.xi;
            var yi = Imouse.yi;
            var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
            for (let d of ds) {
                var _xi = xi; var _yi = yi;
                var dx = d[0]; var dy = d[1];
                _xi += dx; _yi += dy;
                var flag_temp = false;
                while (this.in_board(_xi, _yi)) {
                    if (this.board[_yi][_xi] == 3 - this.turn) {
                        _xi += dx; _yi += dy;
                        flag_temp = true;
                    } else {
                        break;
                    }
                }
                if (!this.in_board(_xi, _yi)) continue;
                if (flag_temp & this.board[_yi][_xi] == this.turn) {
                    while ((_xi != xi) || (_yi != yi)) {
                        this.board[_yi][_xi] = this.turn;
                        _xi -= dx; _yi -= dy;
                    }
                    this.board[_yi][_xi] = this.turn;

                }
            }
            this.turn = 3 - this.turn;
        }
        refresh_okeru() {
            this.okeru = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru(xi, yi)) {
                        this.okeru.push([xi, yi]);
                    }
                }
            }
        }
        check_okeru(xi, yi) {
            return this.check_okeru_from(this.board, this.turn, xi, yi);
        }
        in_board(xi, yi) {
            return 0 <= xi & xi < this.Nsize & 0 <= yi & yi < this.Nsize;
        }
        check_okeru_from(board, turn, xi, yi) {
            var flag = false;
            if (board[yi][xi] != TURN.NONE) return false;
            var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
            // var ds = [[1, 0], [-1, 0]];
            for (let d of ds) {
                var _xi = xi; var _yi = yi;
                var dx = d[0]; var dy = d[1];
                _xi += dx; _yi += dy;
                var flag_temp = false;
                while (this.in_board(_xi, _yi)) {
                    if (board[_yi][_xi] == 3 - turn) {
                        _xi += dx; _yi += dy;
                        flag_temp = true;
                    } else {
                        break;
                    }
                }
                if (!this.in_board(_xi, _yi)) continue;
                if (flag_temp && board[_yi][_xi] == turn) {
                    return true;
                }
            }
            return false;
        }
        count_colors() {
            var black = 0;
            var white = 0;
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.board[yi][xi] == TURN.BLACK) {
                        black++;
                    } else {
                        if (this.board[yi][xi] == TURN.WHITE) {
                            white++;
                        }
                    }
                }
            }
            return { "BLACK": black, "WHITE": white };
        }
        isover() {
            var ncolors = this.count_colors();
            var nall = ncolors["BLACK"] + ncolors["WHITE"];
            if (nall == this.Nsize * this.Nsize) return true;
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru_from(this.board, TURN.BLACK, xi, yi)) return false;
                    if (this.check_okeru_from(this.board, TURN.WHITE, xi, yi)) return false;

                }
            }
            return true;
        }

        copy_board_from(board) {
            var temp = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                temp[yi] = [];
                for (var xi = 0; xi < this.Nsize; xi++) {
                    temp[yi][xi] = board[yi][xi];
                }
            }
            return temp;
        }
    }

    class Player {
        constructor() {
            this.ishuman = true;
            this.iscpu = false;
        }
        think() {

        }
    }

    class CPU extends Player {
        constructor(game) {
            super();
            this.ishuman = false;
            this.iscpu = true;
            this.game = game;
        }
        think() {
            //console.log("thinking...");
            return this.think_random();
            //return this.think_minimize_okeru();
        }
        think_random() {
            // 置ける中からランダム
            return this.game.okeru[Math.floor(Math.random() * this.game.okeru.length)];
        }
        think_minimize_okeru() {
            // 敵の置ける場所の数を最小にするような手を選ぶ
            var min_okeru = 10000;
            var min_i = -1;
            for (let i = 0; i < this.game.okeru.length; i++) {
                var te = this.game.okeru[i];
                var co = this.count_okeru_from_te(te[0], te[1]);
                if (co < min_okeru) {
                    min_okeru = co;
                    min_i = i;
                }
            }
            return this.game.okeru[min_i];
        }
        count_okeru_from_te(xi, yi) {
            var bf = new BoardFuture(this.game.board, this.game.turn, this.game.Nsize);
            bf.update_te(xi, yi);
            return bf.count_okeru();
        }
		simulate_from_players(Nsize, board, turn, game, players){
			// Playersを使ってシミュレート。
            game.players.push(players[0]);
            game.players.push(players[1]);
            game.board = game.copy_board_from(board);
            game.turn = turn;
            game.refresh_okeru();
            var finished = false;
            while (!finished) {
                game.refresh_okeru();
                if (game.okeru.length == 0) {
                    // 合法手がないとき。
                    game.turn = 3 - game.turn;
                    game.refresh_okeru();
                    if (game.okeru.length == 0) {
                        // パスが二回続いたとき終了する。
                        finished = true;
                    }
                } else {
                    //合法手があるとき
                    //CPUなら、手を考える。
                    var player = game.players[game.turn - 1];
                    if (player.iscpu) {
                        var te = player.think();
                        game.put_disc({ xi: te[0], yi: te[1] });
                    }
                }
                // 終了してるか？
                if (game.isover()) {
                    finished = true;
                }
            }
            var ncolors = game.count_colors();
            var result = TURN.NONE;
            if (ncolors["BLACK"] > ncolors["WHITE"]) result = TURN.BLACK;
            if (ncolors["BLACK"] < ncolors["WHITE"]) result = TURN.WHITE;
            return result;
		}
		simulate_okeruminimize(Nsize, board, turn){
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPUOkeruMinimize(game));
            players.push(new CPUOkeruMinimize(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
		}
		simulate_okeruRandom(Nsize, board, turn){
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPUOkeruRandom(game));
            players.push(new CPUOkeruRandom(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
		}
        simulate_random(Nsize, board, turn) {
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPU(game));
            players.push(new CPU(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
        }
        simulate(Nsize, board, turn) {
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPU(game));
            players.push(new CPU(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
		}
    }
	class CPUOkeruRandom extends CPU{
		think(){
			var bias = 6; //置けるミニマイズを出しやすくする。
			var randi = Math.floor(Math.random() * this.game.okeru.length) + bias;
			var te_min = this.think_minimize_okeru();
			if(randi >= this.game.okeru.length) return te_min;
			return this.game.okeru[randi];
		}
	}

    class CPUOkeruMinimize extends CPU {
        think() {
            console.log("thinking...");
            return this.think_minimize_okeru();
        }
    }

    class CPUMonteCarlo extends CPU {
        setTrial(n) {
            this.n = n;
        }
        think() {
            var okeru = this.game.okeru;
            var n = this.n || 500; //総試行回数
            var n_each = n / okeru.length;
            var wins = [];
            var maxi = -1;
            for (var i = 0; i < okeru.length; i++) {
                var bf = new BoardFuture(this.game.board, this.game.turn, this.game.Nsize);
                var te = okeru[i];
                bf.update_te(te[0], te[1]);
                var results = [0, 0, 0];
                for (var j = 0; j < n_each; j++) {
                    var result = this.simulate_random(bf.Nsize, bf.board, bf.turn);
                    results[result] += 1;
                }
                wins[i] = results[this.game.turn];
                if (wins[i] > -1) {
                    maxi = i;
                }
                console.log(okeru[i]);
            }

            return okeru[maxi];
        }
    }

    class CPUMonteCarloTree extends CPU {
        //モンテカルロ木探索を実装した。
        setTrial(n) {
            this.n = n;
        }
        think() {
            var nmax = 2000;
            var n_total = 0;
            var bf = new BoardFuture(this.game.board, this.game.turn, this.game.Nsize);
            var origin = new Node(null, bf, this.game.turn);
            origin.expand();
            while (n_total < nmax) {
                n_total += 1;

                // nodeを決める。
                //origin.printTree();
                var node = origin.getMaxChild();
                while (!node.isleaf) node = node.getMaxChild();
                //console.log(node);
                var result = this.simulate(this.game.Nsize, node.bf.board, node.bf.turn);
                node.update(result);
            }
            var maxi = origin.getIndexMaxN();
            console.log(" ==================== ");
            console.log("maxi = ", maxi);
            origin.printAllTree(2);
            return bf.okeru[maxi];
        }
    }

    class Node {
        constructor(myParent, bf, originturn) {
            this.parent = myParent;
            this.originturn = originturn; // 注： originのturn。
            this.myturn = bf.turn;
            this.children = [];
            this.results = [0, 0, 0];
            this.n = 0;  //そのノードの試行回数
            this.n_total = 0;  //兄弟ノードの試行回数の合計。
            this.thres = 40;
            this.bf = bf;
            this.isleaf = true; // expand時にfalseにする
            this.hashi = false;
            if (myParent === null) {
                this.depth = 0;
                this.isorigin = true;
            } else {
                this.depth = this.parent.depth + 1;
                this.isorigin = false;
            }
            this.ucb1 = this.calc_ucb1();
        }
        printTree() {
            var ss = "";
            ss += this.results + " " + this.ucb1 + " maxi = " + this.getIndexMaxUCB1() + "\n";
            for (let child of this.children) {
                ss += child.results + " " + child.ucb1 + " maxi = " + child.getIndexMaxUCB1() + "\n";
            }
            console.log(ss);
        }
        printNode() {
            var ss = "";
            for (var i = 0; i < this.depth + 1; i++) ss += "  ";
            console.log(ss + this.results + " " + this.results[this.originturn] / this.n + " " + this.myturn);
        }
        printAllTree(maxdepth) {
            if (maxdepth < this.depth) return;
            var ss = "";
            for (var i = 0; i < this.depth; i++) ss += "  ";
            console.log(ss + "D=" + this.depth + " " + this.te);
            this.printNode();
            if (!this.hashi) {
                var maxindex = this.getIndexMaxN();
                for (var i = 0; i < this.children.length; i++) {
                    if (this.depth == 0 && i == maxindex) console.log("= = = ↓ selected = = =");
                    this.children[i].printAllTree(maxdepth);
                }
            }
        }
        update(result) {
            this.n += 1;
            this.results[result] += 1;
            this.parent.n_total += 1;
            this.ucb1 = this.calc_ucb1();
            var par = this;
            while (!par.isorigin) {
                par = par.parent;
                par.n += 1;
                par.results[result] += 1;
                par.ucb1 = par.calc_ucb1();
            }
            if (this.n == this.thres && !this.hashi) this.expand();
        }
        calc_ucb1() {
            var n_total;
            if (this.isorigin) {
                n_total = 1;
            } else {
                n_total = this.parent.n_total;
            }
            var win = this.results[3 - this.myturn];　// そのノードでの勝ち。相手は最善を打つ。
            var n = this.n;
            if(n == 0) return 400000;
			
            var ucb1 = win / n + 0.4 * Math.sqrt(2 * Math.log(n_total) / this.n);
			//if(this.te != null && this.bf.isYosumi(this.te)) ucb1 += 5;
			return ucb1;
        }
        getMaxChild() {
            var val = -1;
            var maxi = -1;
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (child.n == 0) {
                    maxi = i;
                    break;
                }
                if (val < child.ucb1) {
                    val = child.ucb1;
                    maxi = i;
                }
            }
            return this.children[maxi];
        }
        getIndexMaxUCB1() {
            var val = -1;
            var maxi = 0;
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
				var ucb1 = child.ucb1;
                if (child.n == 0) {
                    maxi = i;
                    break;
                }
                if (val < ucb1) {
                    val = ucb1;
                    maxi = i;
                }
            }
            return maxi;
        }
        getIndexMaxN() {
            var maxi = -1;
            var maxval = -1;
            for (var i = 0; i < this.children.length; i++) {
				//if(this.bf.isYosumi(this.children[i].te)) return i;
                if (maxval < this.children[i].n) {
                    maxi = i;
                    maxval = this.children[i].n;
                }
            }
            return maxi;
        }
        getIndexMaxWin() {
            var maxi = -1;
            var maxval = -1;
            for (var i = 0; i < this.children.length; i++) {
                if (maxval < this.children[i].n) {
                    maxi = i;
                    maxval = this.children[i].n;
                }
            }
            return maxi;
        }
        expand() {
            if (this.bf.okeru.length == 0) {
                this.bf.turn = 3 - this.bf.turn;
                this.bf.update_okeru();
                if (this.bf.okeru.length == 0) {
                    this.hashi = true;
                    return;
                }
            }
            for (let te of this.bf.okeru) {
                var bf = this.bf.copy();
                bf.put_disc(te[0], te[1]);
                bf.turn = 3 - bf.turn;
                bf.update_okeru();
                var child = new Node(this, bf, this.originturn);
                child.te = te;
                this.children.push(child);
            }
            this.isleaf = false;
        }
    }



    class BoardFuture {
        constructor(board, turn, Nsize) {
            this.future = [];
            this.Nsize = Nsize;
            this.future.push(this.copy_board_from(board));
            this.board = this.copy_board_from(board);
            this.turn = turn;
            this.update_okeru();
        }
		isYosumi(te){
			if(te[0] == 0 && te[1] == 0) return true;
			if(te[0] == this.Nsize-1 && te[1] == 0) return true;
			if(te[0] == 0 && te[1] == this.Nsize-1) return true;
			if(te[0] == this.Nsize-1 && te[1] == this.Nsize-1) return true;
			return false;
		}
        copy() {
            return new BoardFuture(this.board, this.turn, this.Nsize);
        }
        copy_board_from(board) {
            var temp = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                temp[yi] = [];
                for (var xi = 0; xi < this.Nsize; xi++) {
                    temp[yi][xi] = board[yi][xi];
                }
            }
            return temp;
        }
        update_te(xi, yi) {
            this.put_disc(xi, yi);
            this.turn = 3 - this.turn;
            this.future.push(this.copy_board_from(this.board));
        }
        back() {
            this.future.pop();
            this.board = this.future[this.future.length - 1];
            this.turn = 3 - this.turn;
        }
        put_disc(xi, yi) {
            var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
            for (let d of ds) {
                var _xi = xi; var _yi = yi;
                var dx = d[0]; var dy = d[1];
                _xi += dx; _yi += dy;
                var flag_temp = false;
                while (this.in_board(_xi, _yi)) {
                    if (this.board[_yi][_xi] == 3 - this.turn) {
                        _xi += dx; _yi += dy;
                        flag_temp = true;
                    } else {
                        break;
                    }
                }
                if (!this.in_board(_xi, _yi)) continue;
                if (flag_temp & this.board[_yi][_xi] == this.turn) {
                    while ((_xi != xi) || (_yi != yi)) {
                        this.board[_yi][_xi] = this.turn;
                        _xi -= dx; _yi -= dy;
                    }
                    this.board[_yi][_xi] = this.turn;

                }
            }
        }
        check_okeru(xi, yi) {
            return this.check_okeru_from(this.board, this.turn, xi, yi);
        }
        check_okeru_from(board, turn, xi, yi) {
            var flag = false;
            if (board[yi][xi] != TURN.NONE) return false;
            var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
            // var ds = [[1, 0], [-1, 0]];
            for (let d of ds) {
                var _xi = xi; var _yi = yi;
                var dx = d[0]; var dy = d[1];
                _xi += dx; _yi += dy;
                var flag_temp = false;
                while (this.in_board(_xi, _yi)) {
                    if (board[_yi][_xi] == 3 - turn) {
                        _xi += dx; _yi += dy;
                        flag_temp = true;
                    } else {
                        break;
                    }
                }
                if (!this.in_board(_xi, _yi)) continue;
                if (flag_temp && board[_yi][_xi] == turn) {
                    return true;
                }
            }
            return false;
        }
        in_board(xi, yi) {
            return 0 <= xi & xi < this.Nsize & 0 <= yi & yi < this.Nsize;
        }
        count_okeru() {
            var board = this.board;
            var turn = this.turn;
            var okeru = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru_from(board, turn, xi, yi)) {
                        okeru.push([xi, yi]);
                    }
                }
            }
            return okeru.length;
        }
        update_okeru() {
            this.okeru = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru(xi, yi)) {
                        this.okeru.push([xi, yi]);
                    }
                }
            }
        }

    }
    var maneger = new OthelloController(8, cnvs.width());
    var p_main = cnvs.position();
    var mouse_global = { x: 0, y: 0 };
    var clicked = false;
    cnvs.mousemove((e) => {
        var x = e.pageX - p_main.left;
        var y = e.pageY - p_main.top;
        mouse_global.x = x;
        mouse_global.y = y;
    });
	function click_event(maneger){
		maneger.gui.click();
	}
    cnvs.click(() => {
        clicked = true;
		setTimeout(click_event, 0, maneger);
    });
    $("#vsHuman").click(() => {
        maneger.start_human();
    });
    $("#vsCPU").click(() => {
		$(".startbtn").hide();
		$(".cpubtn").show();
    });
    $("#vsCPU1").click(() => {
        maneger.start_cpu(1);
    });
    $("#vsCPU2").click(() => {
        maneger.start_cpu(2);
    });
    $("#vsCPU3").click(() => {
        maneger.start_cpu(3);
    });
    $("#CPUvsCPU").click(() => {
        maneger.start_cpu(11);
    });
    $("#back").click(() => {
        $(".simulation").hide();
		$(".cpubtn").hide();
        $(".startbtn").show();
		$("#cnvs").addClass("w3-opacity");
    });

    function render() {
        maneger.update(mouse_global);
    }
    setInterval(render, 100);

});
