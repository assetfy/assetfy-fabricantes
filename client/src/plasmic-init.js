
import { initPlasmicLoader } from "@plasmicapp/loader-react";
import Login from "./components/Login";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "m4gueuaeFTHSnAgegM6Ju3",
      token: "afkD3mYjpsDTS3CxRpccPiTMXotV2gBXDUaZ7FRnLb6C3Vp0xLWp6oFqeJPdG026mODm309s0r11uqv9S5enw"
    }
  ],
  preview: true,
});

PLASMIC.registerComponent(Login, {
  name: "Login",
  props: {
    // Aquí defines qué quieres poder cambiar desde la web
    titulo: "string", 
    mostrarBoton: "boolean"
  },
  importPath: "./components/Login", // Ruta relativa desde src
});