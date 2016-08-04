package de.hsos.vs.ws;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.json.Json;
import javax.json.JsonObject;
import javax.websocket.CloseReason;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint("/join/{room}")
public class SignalEndpoint {

    static final Logger logger = Logger.getLogger(SignalEndpoint.class.getName());

    static Session p1;
    static Session p2;

    @OnOpen
    public void onOpen(Session session, @PathParam("room") String room) throws IOException {
        System.out.println("onOpen()");
        System.out.println("Room:" + room);

        if (p1 == null) {
            System.out.println("player1");
            p1 = session;
        } else {
            System.out.println("player2");
            p2 = session;
            p1.getAsyncRemote().sendText(buildJoinRequest());
        }

        // room prüfen
        if (false) {
            session.close(new CloseReason(CloseReason.CloseCodes.VIOLATED_POLICY, null));
        }
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        System.out.println("onMessage()");
        System.out.println(message);

        if (p1 == session) {
            p2.getAsyncRemote().sendText(message);
        } else {
            p1.getAsyncRemote().sendText(message);
        }

    }

    @OnClose
    public void onClose() {
        System.out.println("onClose()");
        // aufräumen
        p1 = null;
        p2 = null;
    }

    @OnError
    public void onError(Throwable t) {
        logger.log(Level.SEVERE, "Error in WS Endpoint", t);
    }

    private String buildJoinRequest() {
        JsonObject obj = Json.createObjectBuilder()
                .add("action", "join-request")
                .add("profile", "name etc.").build();
        return obj.toString();
    }

}
