
// MIT License
// Martin Froehlich for tecartlab.com
// Copyright 2020 - tecartlab.com

#version 120
#extension GL_ARB_texture_rectangle : enable

/*
	Multifunctional texture projection shader with full feature set.
*/

uniform float projection_mode;
uniform int stage_mode;
uniform int mode;

// samplers (the first texture is the objects default texture!!)
uniform sampler2DRect tex0;
uniform sampler2DRect tex1;
uniform sampler2DRect tex2;
uniform sampler2DRect tex3;
uniform sampler2DRect tex4;
uniform sampler2DRect tex5;
uniform sampler2DRect tex6;

uniform int beamer_count;
uniform vec4 beamer_color[6];

uniform mat4 beamer_v_matrix[6];

uniform vec3 beamer_pos[6];
uniform vec3 beamer_dir[6];

uniform float bevel_size[6];
uniform float bevel_curve[6];
uniform int bevel_round[6];

uniform vec4 offColor; 	// off color

uniform float distance_influence;
uniform float back_blend;
uniform float blend_spread;
uniform float angle_mode;

uniform float angle_limit_low[6];
uniform float angle_limit_high[6];

uniform float far_clip[6];

uniform float interpolation_correction;

// generated by the vertex shader

varying vec4 beamer_uv[6];		// beamer uv position
varying vec2 beamer_texcoord[6];// beamer texcoord

varying vec3 normal;	// surface normal
varying vec3 worldPos;	// vertex world position


// constants

const float PI = 3.1415926535897932384626433832795;
const float PI_HALF = PI / 2.0;
const vec4 WHITE = vec4( 1.0, 1.0, 1.0, 1.0);
const vec4 BLACK = vec4( 0.0, 0.0, 0.0, 1.0);

// entry point
void main()
{
    // calculate rotation matrix from beamer view matrix - its not accurate and cause problem if
    // the matrix is not scale = 1 1 1, but its a quick and functional fix that should not be a heavy
    // performance hit.
    mat4 rot_matrix = beamer_v_matrix[0];
    rot_matrix[3] = vec4(0., 0., 0., 1.); // the positional infos are removed.

    // calculate the viewray from the camera to this fragment
    vec4 ray = vec4(worldPos - beamer_pos[0], 1);
    vec3 viewline = (rot_matrix * ray).xyz;
    vec3 vl_abs = abs(viewline);

	vec3 raynormal = normalize(-ray.xyz);

	// calculate the angle between the surface normal and the projected beam.
	// 		rsp. the angle between the surface normal and the projector direction.
	float angle = dot(normal, raynormal);

	// sets from which side (back, both, front) it is visible
	float side = (projection_mode == 0.)? 1.:max(sign(angle * projection_mode), 0.);

	vec4 texcoord0;

	vec4 color;

	if(vl_abs.x > vl_abs.y && vl_abs.x > vl_abs.z){
		if(viewline.x >= 0.0){ //RIGHT
			texcoord0 = vec4(
						(viewline.z / vl_abs.x) * 0.5 + 0.5,
						(viewline.y / vl_abs.x) * 0.5 + 0.5, 0., 1.);
			color = texture2DRect(tex3, (gl_TextureMatrix[1] * texcoord0).st);
		}else{ //LEFT
			texcoord0 = vec4(
						-(viewline.z / vl_abs.x) * 0.5 + 0.5,
						(viewline.y / vl_abs.x) * 0.5 + 0.5, 0., 1.);
			color = texture2DRect(tex1, (gl_TextureMatrix[1] * texcoord0).st);
		}
	} else if(vl_abs.y > vl_abs.x && vl_abs.y > vl_abs.z){
		if(viewline.y >= 0.0){ //TOP
			texcoord0 = vec4(
						(viewline.x / vl_abs.y) * 0.5 + 0.5,
						(viewline.z / vl_abs.y) * 0.5 + 0.5, 0., 1.);
			color = texture2DRect(tex5, (gl_TextureMatrix[1] * texcoord0).st);
		}else{
			texcoord0 = vec4( //BOTTOM
						(viewline.x / vl_abs.y) * 0.5 + 0.5,
						-(viewline.z / vl_abs.y) * 0.5 + 0.5, 0., 1.);
			color = texture2DRect(tex6, (gl_TextureMatrix[1] * texcoord0).st);
		}
	} else if(vl_abs.z > vl_abs.x && vl_abs.z > vl_abs.y){
		if(viewline.z >= 0.0){
			texcoord0 = vec4( //BACK
						-(viewline.x / vl_abs.z) * 0.5 + 0.5,
						(viewline.y / vl_abs.z) * 0.5 + 0.5, 0., 1.);
			color = texture2DRect(tex4, (gl_TextureMatrix[1] * texcoord0).st);
		}else{
			texcoord0 = vec4( //FRONT
						(viewline.x / vl_abs.z) * 0.5 + 0.5,
						(viewline.y / vl_abs.z) * 0.5 + 0.5, 0., 1.);
			color = texture2DRect(tex2, (gl_TextureMatrix[1] * texcoord0).st);
		}
	}

	gl_FragColor = (side > 0)?color:offColor;

    // in case it is rendered to stage and stage_mode is set to colored:
	if(mode == 0 && stage_mode >= 1){
		if(vl_abs.x > vl_abs.y && vl_abs.x > vl_abs.z){
			gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
		} else 	if(vl_abs.y > vl_abs.x && vl_abs.y > vl_abs.z){
			gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
		} else 	if(vl_abs.z > vl_abs.x && vl_abs.z > vl_abs.y){
			gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
		}
	}
}
