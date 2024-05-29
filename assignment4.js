import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Assignment4 extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            box_1: new Cube(),
            box_2: new Cube(),
            axis: new Axis_Arrows()
        }

        console.log(this.shapes.box_1.arrays.texture_coord)
        this.shapes.box_2.arrays.texture_coord = this.shapes.box_2.arrays.texture_coord.map(x => x.times(2));
        this.isRotating = false;


        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            stars: new Material(new Texture_Rotate(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/stars.png", "NEAREST")
            }),
            world: new Material(new Texture_Scroll_X(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/earth.gif", "LINEAR_MIPMAP_LINEAR")
            }),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.box1_transform = Mat4.identity().times(Mat4.translation(-2,0,0));
        this.box2_transform = Mat4.identity().times(Mat4.translation(2,0,0));
    }

    make_control_panel() {
        // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
        this.key_triggered_button("Cube Rotation", ["c"], () => 
            this.isRotating = !this.isRotating);
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        // TODO:  Draw the required boxes. Also update their stored matrices.
        // You can remove the folloeing line.
        if (this.isRotating) {
            // box 1
            let box1rot = Math.PI/2 * dt;
            this.box1_transform = this.box1_transform.times(Mat4.rotation(box1rot,1,0,0));
    
            let box2rot = ((4/3) * (Math.PI)) * dt
            this.box2_transform = this.box2_transform.times(Mat4.rotation(box2rot,0,1,0));
           }
         this.shapes.box_1.draw(context, program_state, this.box1_transform, this.materials.stars);
         this.shapes.box_2.draw(context, program_state, this.box2_transform, this.materials.world);
    }
}


class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){

                float slide_value = mod(animation_time,4.0) * 4.0;; 
               
                mat4 slide_matrix = mat4(vec4(-1.0, 0.0, 0., 0.), 
                                   vec4( 0.0, 1.0, 0.0, 0.0), 
                                   vec4( 0.0, 0.0, 1.0, 0.0), 
                                   vec4(slide_value, 0.0, 0.0, 1.0)); 

                vec4 new_tex_coord = vec4(f_tex_coord, 0, 0) + vec4(1.0, 1.0, 0.0, 1.0); 
                new_tex_coord = slide_matrix * new_tex_coord; 

                vec4 tex_color = texture2D(texture, new_tex_coord.xy);

                 float u = mod(new_tex_coord.x, 1.0);
                 float v = mod(new_tex_coord.y, 1.0);


                //black square 
                // right 
                if (u > 0.75 && u < 0.85 && v > 0.15 && v < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                // left 
                 if (u > 0.15 && u < 0.25 && v > 0.15 && v < 0.85) {
                     tex_color = vec4(0, 0, 0, 1.0);
                 }
                // bottom 
                 if (v > 0.15 && v < 0.25 && u > 0.15 && u < 0.85) {
                     tex_color = vec4(0, 0, 0, 1.0);
                 }
                // top 
                 if (v > 0.75 && v < 0.85 && u > 0.15 && u < 0.85) {
                     tex_color = vec4(0, 0, 0, 1.0);
                 }


                if( tex_color.w < .01 ) discard;
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}


class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){
                     
                    // 8 rpm  = 4/15 * PI rad * seconds = .266667 * pi * time
                    float rotation_angle = .266667 * 3.14159265 * mod(animation_time, 7.5); 
                    mat4 rotation_matrix = 
                                    mat4(vec4(cos(rotation_angle), sin(rotation_angle), 0.0, 0.0), 
                                    vec4(sin(rotation_angle), -cos(rotation_angle), 0.0, 0.0), 
                                    vec4( 0.0, 0.0, 1.0, 0.0), 
                                    vec4( 0.0, 0.0, 0.0, 1.0));

                vec4 new_tex_coord = vec4(f_tex_coord, 0, 0) + vec4(-0.5, -0.5, 0.0, 0.0);
                new_tex_coord = (rotation_matrix * new_tex_coord) + vec4(0.5, 0.5, 0.0, 0.0); 
                       
                vec4 tex_color = texture2D(texture, new_tex_coord.xy);
                
                //black outlines
                 float u = mod(new_tex_coord.x, 1.0);
                 float v = mod(new_tex_coord.y, 1.0);


                // right 
                if (v > 0.15 && v < 0.85 && u > 0.75 && u < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                } 
                // left 
                 if (v > 0.15 && v < 0.85 && u > 0.15 && u < 0.25) {
                     tex_color = vec4(0, 0, 0, 1.0);
                 }
                 // top 
                 if (v > 0.75 && v < 0.85 && u > 0.15 && u < 0.85) {
                     tex_color = vec4(0, 0, 0, 1.0);
                 }
                // bottom 
                 if (v > 0.15 && v < 0.25 && u > 0.15 && u < 0.85) {
                     tex_color = vec4(0, 0, 0, 1.0);
                 }

                if( tex_color.w < .01 ) discard;
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

