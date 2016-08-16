package de.hsos.vs.rest;

import de.hsos.vs.td.Lobby;
import de.hsos.vs.td.LobbyList;
import java.io.IOException;
import java.util.Map;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonWriter;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet(name = "LobbyServlet", urlPatterns = {"/lobbys"})
public class LobbyServlet extends HttpServlet {

    /**
     * Handles the HTTP GET method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        JsonArrayBuilder objBuilder = Json.createArrayBuilder();

        for (Map.Entry<String, Lobby> entry : LobbyList.lobbys.entrySet()) {
            Lobby lobby = entry.getValue();
            if (lobby.canJoin()) {
                // Alle Lobbys auflisten
                objBuilder.add(lobby.buildLobbyDescription(entry.getKey()));
            }
        }

        try (JsonWriter jsonWriter = Json.createWriter(response.getWriter())) {
            jsonWriter.writeArray(objBuilder.build());
        }

    }

}
