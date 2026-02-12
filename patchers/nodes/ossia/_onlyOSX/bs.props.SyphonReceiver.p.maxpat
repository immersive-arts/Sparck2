{
    "patcher": {
        "fileversion": 1,
        "appversion": {
            "major": 9,
            "minor": 1,
            "revision": 0,
            "architecture": "x64",
            "modernui": 1
        },
        "classnamespace": "box",
        "rect": [ 2050.0, 650.0, 729.0, 395.0 ],
        "openinpresentation": 1,
        "toolbarvisible": 0,
        "enablehscroll": 0,
        "enablevscroll": 0,
        "boxes": [
            {
                "box": {
                    "args": [ "#1", "render/pass", "@text", "pass", "@items", "passA", "passB", "passC", "passD", "passE", "passF", "passG", "passH", "passZ", "@type", "string", "@size", 59, 18 ],
                    "bgmode": 0,
                    "border": 0,
                    "clickthrough": 1,
                    "enablehscroll": 0,
                    "enablevscroll": 0,
                    "id": "obj-36",
                    "lockeddragscroll": 0,
                    "lockedsize": 0,
                    "maxclass": "bpatcher",
                    "name": "bs.ossia.remote.select.maxpat",
                    "numinlets": 3,
                    "numoutlets": 4,
                    "offset": [ 0.0, 0.0 ],
                    "outlettype": [ "int", "", "", "" ],
                    "patching_rect": [ 250.5, 216.0, 208.0, 17.0 ],
                    "presentation": 1,
                    "presentation_rect": [ 0.0, 60.0, 120.0, 19.0 ],
                    "viewvisibility": 1
                }
            },
            {
                "box": {
                    "args": [ "#1", "flipY", "@text", "flip Y" ],
                    "bgmode": 0,
                    "border": 0,
                    "clickthrough": 1,
                    "enablehscroll": 0,
                    "enablevscroll": 0,
                    "id": "obj-6",
                    "lockeddragscroll": 0,
                    "lockedsize": 0,
                    "maxclass": "bpatcher",
                    "name": "bs.ossia.remote.toggle.maxpat",
                    "numinlets": 3,
                    "numoutlets": 3,
                    "offset": [ 0.0, 0.0 ],
                    "outlettype": [ "", "", "" ],
                    "patching_rect": [ 248.0, 174.0, 206.0, 21.0 ],
                    "presentation": 1,
                    "presentation_rect": [ 120.0, 40.0, 100.0, 19.0 ],
                    "viewvisibility": 1
                }
            },
            {
                "box": {
                    "args": [ "#1", "app", "@text", "app", "@size", 159, 19, "@menutype", "message" ],
                    "bgmode": 0,
                    "border": 0,
                    "clickthrough": 1,
                    "enablehscroll": 0,
                    "enablevscroll": 0,
                    "id": "obj-5",
                    "lockeddragscroll": 0,
                    "lockedsize": 0,
                    "maxclass": "bpatcher",
                    "name": "bs.ossia.remote.menu.maxpat",
                    "numinlets": 3,
                    "numoutlets": 4,
                    "offset": [ 0.0, 0.0 ],
                    "outlettype": [ "", "int", "", "" ],
                    "patching_rect": [ 248.0, 117.5, 201.0, 22.0 ],
                    "presentation": 1,
                    "presentation_rect": [ 0.0, 20.0, 240.0, 19.0 ],
                    "viewvisibility": 1
                }
            },
            {
                "box": {
                    "args": [ "#1", "flipX", "@text", "flip X" ],
                    "bgmode": 0,
                    "border": 0,
                    "clickthrough": 1,
                    "enablehscroll": 0,
                    "enablevscroll": 0,
                    "id": "obj-11",
                    "lockeddragscroll": 0,
                    "lockedsize": 0,
                    "maxclass": "bpatcher",
                    "name": "bs.ossia.remote.toggle.maxpat",
                    "numinlets": 3,
                    "numoutlets": 3,
                    "offset": [ 0.0, 0.0 ],
                    "outlettype": [ "", "", "" ],
                    "patching_rect": [ 248.0, 146.0, 206.0, 21.0 ],
                    "presentation": 1,
                    "presentation_rect": [ 0.0, 40.0, 100.0, 19.0 ],
                    "viewvisibility": 1
                }
            },
            {
                "box": {
                    "args": [ "#1", "server", "@text", "server", "@size", 159, 19, "@menutype", "message" ],
                    "bgmode": 0,
                    "border": 0,
                    "clickthrough": 1,
                    "enablehscroll": 0,
                    "enablevscroll": 0,
                    "id": "obj-8",
                    "lockeddragscroll": 0,
                    "lockedsize": 0,
                    "maxclass": "bpatcher",
                    "name": "bs.ossia.remote.menu.maxpat",
                    "numinlets": 3,
                    "numoutlets": 4,
                    "offset": [ 0.0, 0.0 ],
                    "outlettype": [ "", "int", "", "" ],
                    "patching_rect": [ 248.0, 91.5, 201.0, 22.0 ],
                    "presentation": 1,
                    "presentation_rect": [ 0.0, 0.0, 240.0, 19.0 ],
                    "viewvisibility": 1
                }
            },
            {
                "box": {
                    "color": [ 0.12549, 0.796078, 0.894118, 1.0 ],
                    "id": "obj-17",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 301.0, 63.0, 71.0, 22.0 ],
                    "text": "sparck.view"
                }
            },
            {
                "box": {
                    "id": "obj-4",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 301.0, 34.0, 107.0, 22.0 ],
                    "text": "routepass address"
                }
            },
            {
                "box": {
                    "id": "obj-2",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 248.0, 5.0, 72.0, 22.0 ],
                    "text": "patcherargs"
                }
            },
            {
                "box": {
                    "angle": 270.0,
                    "border": 2,
                    "bordercolor": [ 0.0, 0.0, 0.0, 0.8 ],
                    "grad1": [ 0.65098, 0.666667, 0.662745, 0.0 ],
                    "grad2": [ 0.65098, 0.666667, 0.662745, 1.0 ],
                    "hidden": 1,
                    "id": "obj-3",
                    "maxclass": "panel",
                    "mode": 1,
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 0.0, 0.0, 242.0, 40.0 ],
                    "presentation": 1,
                    "presentation_rect": [ 0.0, 0.0, 242.0, 40.0 ],
                    "proportion": 0.39,
                    "varname": "vpl_canvas_folded"
                }
            },
            {
                "box": {
                    "angle": 270.0,
                    "border": 2,
                    "bordercolor": [ 0.0, 0.0, 0.0, 0.8 ],
                    "grad1": [ 0.65098, 0.666667, 0.662745, 1.0 ],
                    "grad2": [ 0.65098, 0.666667, 0.662745, 1.0 ],
                    "hidden": 1,
                    "id": "obj-1",
                    "maxclass": "panel",
                    "mode": 1,
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 0.0, 0.0, 242.0, 84.0 ],
                    "presentation": 1,
                    "presentation_rect": [ 0.0, 0.0, 242.0, 82.0 ],
                    "proportion": 0.39,
                    "varname": "vpl_canvas_unfolded"
                }
            }
        ],
        "lines": [
            {
                "patchline": {
                    "destination": [ "obj-4", 0 ],
                    "source": [ "obj-2", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 0 ],
                    "source": [ "obj-4", 0 ]
                }
            }
        ],
        "autosave": 0,
        "styles": [
            {
                "name": "AudioStatus_Menu",
                "default": {
                    "bgfillcolor": {
                        "angle": 270.0,
                        "autogradient": 0,
                        "color": [ 0.294118, 0.313726, 0.337255, 1 ],
                        "color1": [ 0.454902, 0.462745, 0.482353, 0.0 ],
                        "color2": [ 0.290196, 0.309804, 0.301961, 1.0 ],
                        "proportion": 0.39,
                        "type": "color"
                    }
                },
                "parentstyle": "",
                "multi": 0
            },
            {
                "name": "Jamoma_highlighted_orange",
                "default": {
                    "accentcolor": [ 1.0, 0.5, 0.0, 1.0 ]
                },
                "parentstyle": "",
                "multi": 0
            },
            {
                "name": "STYLE1",
                "parentstyle": "",
                "multi": 0
            },
            {
                "name": "jpatcher001",
                "parentstyle": "",
                "multi": 0
            }
        ],
        "bgcolor": [ 1.0, 1.0, 1.0, 0.0 ]
    }
}