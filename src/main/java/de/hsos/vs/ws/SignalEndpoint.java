package de.hsos.vs.ws;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.websocket.CloseReason;
import javax.websocket.CloseReason.CloseCodes;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint("/join/{lobby}")
public class SignalEndpoint {

    static final Logger logger = Logger.getLogger(SignalEndpoint.class.getName());

    static ConcurrentHashMap<String, Lobby> lobbys = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("lobby") String lobby) throws IOException {
        logger.log(Level.INFO, "onOpen lobby {0}", lobby);

        Lobby l = lobbys.get(lobby);
        if (l == null) {
            // Lobby erstellen
            lobbys.put(lobby, new Lobby(session));
        } else if (l.canJoin()) {
            // Lobby beitreten
            l.join(session);
        } else {
            // Lobby voll
            session.close(new CloseReason(CloseCodes.VIOLATED_POLICY, null));
        }

    }

    @OnMessage
    public void onMessage(String text, Session session, @PathParam("lobby") String lobby) {
        logger.log(Level.INFO, "onMessage lobby {0}", lobby);
        // Message zum Peer senden
        lobbys.get(lobby).signal(session, text);

    }

    @OnClose
    public void onClose(Session session, @PathParam("lobby") String lobby) throws IOException {
        logger.log(Level.INFO, "onClose lobby {0}", lobby);

        Lobby l = lobbys.get(lobby);
        if (l != null && l.quit(session)) {
            lobbys.remove(lobby);
        }

    }

    @OnError
    public void onError(Throwable t) {
        logger.log(Level.SEVERE, "Error in WS Endpoint", t);
    }

}
