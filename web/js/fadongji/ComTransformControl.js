//发动机向场景中增加变换组件
const ComTransformControl=function(s){
	var control;
	var myself=this;
	var scene=s;
	this.addControl=function (){
		control = new THREE.TransformControls( camera, renderer.domElement );
		control.addEventListener( 'change', function function_name(argument) {
			// body...
			control.update();

			renderer.render( scene, camera );
			var target=global.tempactivity;
			if(target){
				if(mode=="teacher"){
	       			var json={
						event:"transformChildChange",
						targetID:target.id,
						uuid:target.uuid,
						targetName:target.name,
						position:target.position,
						rotation:target.rotation,
						scale:target.scale
					}

					teacherDataChanger(json);
	           	}
			}else{
				if(mode=="teacher"){
	       			var json={
						event:"transformChange",
						position:com3d.position,
						rotation:com3d.rotation,
						scale:com3d.scale
					}
					teacherDataChanger(json);
					
	           	}
           }
		} );
		scene.add( control );
		window.addEventListener( 'keydown', function ( event ) {

			switch ( event.keyCode ) {

				case 81: // Q
					control.setSpace( control.space === "local" ? "world" : "local" );
					break;

				case 17: // Ctrl
					control.setTranslationSnap( 100 );
					control.setRotationSnap( THREE.Math.degToRad( 15 ) );
					break;

				case 87: // W
					control.setMode( "translate" );
					break;

				case 69: // E
					control.setMode( "rotate" );
					break;

				case 82: // R
					control.setMode( "scale" );
					break;

				case 187:
				case 107: // +, =, num+
					control.setSize( control.size + 0.1 );
					break;

				case 189:
				case 109: // -, _, num-
					control.setSize( Math.max( control.size - 0.1, 0.1 ) );
					break;

			}

		});
	};
	this.setMode=function(mode){
		control.setMode( mode );
	};
	this.attach=function(com){
		controlattack=true;
		control.attach( com );
	};
	this.detach=function(com){
		if(controlattack){
			controlattack=false;
			control.detach( com );
		}
	};
	this.getControlAttack=function(){
		return controlattack;
	};
	var controlattack=false;//用于标记变换是否开启
	this.changeEnable=function(com){
		if(controlattack){
			detach(com);
		}else{
			attach(com);
		}
	}
}