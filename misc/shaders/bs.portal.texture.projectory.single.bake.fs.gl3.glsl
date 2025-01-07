
// MIT License
// Martin Froehlich for tecartlab.com
// Copyright 2020 - tecartlab.com

#version 330 core

layout (location = 0) out vec4 outColor0;

uniform float projection_mode;
uniform int stage_mode;

// samplers
uniform samplerJit0 tex0;
uniform samplerJit1 tex1;
uniform samplerJit2 tex2;
uniform samplerJit3 tex3;
uniform samplerJit4 tex4;
uniform samplerJit5 tex5;
uniform samplerJit6 tex6;

uniform mat4 textureMatrix0;
uniform mat4 textureMatrix1;
uniform mat4 textureMatrix2;
uniform mat4 textureMatrix3;
uniform mat4 textureMatrix4;
uniform mat4 textureMatrix5;
uniform mat4 textureMatrix6;

uniform vec4 beamer_color[6];

uniform vec3 beamer_dir[6];
uniform vec3 beamer_pos[6];

uniform vec4 offColor; 	    // off color
uniform int back_blend;     // blend background color
uniform int use_bgcolor;    // use background color

uniform float interpolation_correction;

// generated by the vertex shader
in jit_PerVertex {
    vec4 beamer_uv[6];
    vec2 beamer_texcoord[6];
    vec2 texcoord6; 
   float depth[6];
    vec3 normal;
    vec3 worldPos;
} jit_in;


vec4 getTexture2DRect(int index, vec2 coord){
	return texture(tex0, coord);
}

vec4 getProjectorColor(int i){
	return getTexture2DRect(i, jit_in.beamer_texcoord[i]);
}

vec4 alphablend(vec4 src, vec4 dst){
	float outA = src.a + dst.a * (1.0 - src.a);
	return vec4((src.rgb * src.a + dst.rgb * dst.a * (1.0 - src.a))/outA, outA);
}

// entry point
void main()
{
	vec3 ray, raynormal;
	vec2 col;
	float angle;
	int i = 0;

	ray = beamer_pos[i] - jit_in.worldPos;
	raynormal = normalize(ray);

	// calculate the angle between the surface normal and the projected beam.
	// 		rsp. the angle between the surface normal and the projector direction.
	angle = dot(jit_in.normal, raynormal);

	// sets from which side (back, both, front) it is visible
	angle = (projection_mode == 0.)? 1.:max(sign(angle * projection_mode), 0.);

	// checks if the worldPos is in front of the camera.
	//   the interpolation_correction factor is making sure that fragment
	//   interpolation errors will be cut away, with the negative
	//   sideeffect of less total angle visibility.
	angle = angle * max(sign(dot(beamer_dir[i],raynormal)-interpolation_correction), 0.);

	// calculate the viewport linear box blend
	col = (0.5 - abs(jit_in.beamer_uv[i].xy - 0.5));

	vec4 fragColor = getProjectorColor(i) * sign(clamp(min(col.x,col.y), 0., 1.)) * angle;

    // create gbcolor - either taking it from the background texture or the flat color
    vec4 bgColor = texture(tex6, jit_in.texcoord6) * (1. - use_bgcolor) + offColor * use_bgcolor;

	outColor0 = alphablend(fragColor, bgColor);
}
